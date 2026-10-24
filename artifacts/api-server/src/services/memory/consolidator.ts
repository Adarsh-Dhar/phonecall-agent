/**
 * Consolidator - Post-call memory consolidation
 *
 * Phase 3: Implements call consolidation after a call ends
 * - Loads transcript and previous rolling summary
 * - Makes a structured model call to extract call summary, agreements, proposals, promises
 * - Updates Relationship rolling summary
 * - Creates CallSummary row
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";
import { generateOrchestratorText } from "../nebiusText";
import { extractJsonObject } from "../../lib/extractJson";
import { updateRelationshipSummary, markConsolidating, unmarkConsolidating } from "./relationship";
import { reconcileTaskActions } from "../taskExtraction/reconcileTasks";
import { reconcileKnowledgeActions } from "../taskExtraction/reconcileKnowledge";

interface ConsolidateResult {
  success: boolean;
  callSummary?: {
    outcome: string;
    summary: string;
    agreements: any[];
    proposals: any[];
    promises: any[];
    businessTerms: any;
  };
  rollingSummary?: string;
}

/**
 * Consolidate a call after it ends
 *
 * Triggered by call end event. Idempotent (checks consolidatedAt).
 */
export async function consolidateCall(callId: string): Promise<ConsolidateResult> {
  const startTime = Date.now();

  // Load the call
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: {
      id: true,
      conversationId: true,
      contactId: true,
      individualId: true,
      businessId: true,
      endedAt: true,
      consolidatedAt: true,
      contact: {
        select: {
          name: true,
          business: true,
        },
      },
    },
  });

  if (!call) {
    logger.error({ callId }, "consolidator: call not found");
    return { success: false };
  }

  // Already consolidated
  if (call.consolidatedAt) {
    logger.info({ callId, consolidatedAt: call.consolidatedAt }, "consolidator: already consolidated, skipping");
    return { success: true };
  }

  // Get or create relationship
  const relationship = await prisma.relationship.findUnique({
    where: {
      individualId_businessId: {
        individualId: call.individualId!,
        businessId: call.businessId!,
      },
    },
  });

  if (!relationship) {
    logger.error({ callId, individualId: call.individualId, businessId: call.businessId }, "consolidator: relationship not found");
    return { success: false };
  }

  // Mark as consolidating (advisory lock)
  await markConsolidating(relationship.id);

  try {
    // Load transcript for this call
    const messages = await prisma.message.findMany({
      where: { callId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true, speaker: true },
    });

    if (messages.length === 0) {
      logger.warn({ callId }, "consolidator: no messages found for call");
      await unmarkConsolidating(relationship.id);
      return { success: false };
    }

    // Load previous rolling summary
    const previousSummary = relationship.summary || "";

    // Build transcript text
    const transcript = messages
      .map((m) => {
        const speaker = m.speaker || (m.role === "assistant" ? "agent" : "contact");
        return `${speaker}: ${m.content}`;
      })
      .join("\n");

    // Build prompt for model
    const systemInstruction = `You are analyzing a phone call transcript. Extract structured information about the call.

The call is between:
- The individual (represented by an AI agent)
- ${call.contact.name} (${call.contact.business || "a business"})

Previous context (summary of earlier calls, if any):
${previousSummary || "No previous context."}

Return ONLY a JSON object with these fields:
{
  "outcome": "booked" | "rescheduled" | "cancelled" | "info_gathered" | "needs_user" | "failed",
  "summary": "2-4 sentences summarizing what happened",
  "agreements": [{"what": string, "when": string|null, "who": string}],
  "proposals": [{"what": string, "when": string|null}],
  "promises": [{"by": "agent"|"business", "what": string, "dueAt": string|null}],
  "businessTerms": {"fees": string|null, "hours": string|null, "constraints": string[]}
}

Key distinctions:
- "agreements": confirmed by both parties (e.g., "confirmed for tomorrow 11 AM")
- "proposals": offered but NOT confirmed (e.g., "how about tomorrow 11 AM?" with no confirmation)
- "promises": commitments made by one party (e.g., "I'll send you the invoice by Friday")`;

    const turns = [
      {
        role: "user" as const,
        content: `Call transcript:\n${transcript}`,
      },
    ];

    // Call the model
    const { text } = await generateOrchestratorText({
      systemInstructionText: systemInstruction,
      turns,
      jsonResponse: true,
      temperature: 0.1,
      maxTokens: 1000,
      purpose: "call_consolidation",
    });

    // Parse the response
    const parsed = extractJsonObject(text) as any;

    // Validate required fields
    if (!parsed.outcome || !parsed.summary) {
      logger.error({ callId, parsed }, "consolidator: missing required fields in model output");
      await unmarkConsolidating(relationship.id);
      return { success: false };
    }

    const validOutcomes = ["booked", "rescheduled", "cancelled", "info_gathered", "needs_user", "failed"];
    if (!validOutcomes.includes(parsed.outcome)) {
      logger.error({ callId, outcome: parsed.outcome }, "consolidator: invalid outcome");
      await unmarkConsolidating(relationship.id);
      return { success: false };
    }

    // Build rolling summary (rewrite previous summary + new call into one summary capped at ~800 chars)
    const summaryPrompt = previousSummary
      ? `Previous summary: ${previousSummary}\n\nNew call: ${parsed.summary}\n\nRewrite this into a single concise summary (max 800 characters) that captures the key points from both.`
      : `New call: ${parsed.summary}\n\nSummarize this concisely (max 800 characters).`;

    const summaryTurns = [
      {
        role: "user" as const,
        content: summaryPrompt,
      },
    ];

    const { text: summaryText } = await generateOrchestratorText({
      systemInstructionText: "You are summarizing call history. Keep it concise (max 800 characters).",
      turns: summaryTurns,
      jsonResponse: false,
      temperature: 0.3,
      maxTokens: 500,
      purpose: "summary_consolidation",
    });

    const newRollingSummary = summaryText.trim().slice(0, 800);

    // Create CallSummary
    await prisma.callSummary.create({
      data: {
        callId: call.id,
        relationshipId: relationship.id,
        outcome: parsed.outcome,
        summary: parsed.summary,
        agreements: parsed.agreements || [],
        proposals: parsed.proposals || [],
        promises: parsed.promises || [],
        businessTerms: parsed.businessTerms || {},
        model: "orchestrator",
        promptVersion: 1,
      },
    });

    // Update relationship rolling summary
    await updateRelationshipSummary({
      relationshipId: relationship.id,
      summary: newRollingSummary,
      summaryUpTo: call.endedAt || new Date(),
      lastCallId: call.id,
      lastCallAt: call.endedAt || new Date(),
    });

    // Phase 3: Reconcile tasks and knowledge from the consolidator output
    // The consolidator model could also extract task/knowledge actions in the future
    // For now, we rely on the existing extraction pipeline which runs separately

    // Mark call as consolidated
    await prisma.call.update({
      where: { id: call.id },
      data: { consolidatedAt: new Date() },
    });

    const elapsed = Date.now() - startTime;
    logger.info(
      {
        callId,
        relationshipId: relationship.id,
        outcome: parsed.outcome,
        elapsedMs: elapsed,
      },
      "consolidator: call consolidated successfully"
    );

    return {
      success: true,
      callSummary: {
        outcome: parsed.outcome,
        summary: parsed.summary,
        agreements: parsed.agreements || [],
        proposals: parsed.proposals || [],
        promises: parsed.promises || [],
        businessTerms: parsed.businessTerms || {},
      },
      rollingSummary: newRollingSummary,
    };
  } catch (error) {
    logger.error({ err: error, callId }, "consolidator: consolidation failed");
    await unmarkConsolidating(relationship.id);
    return { success: false };
  }
}

/**
 * Schedule consolidation for a call (enqueue for background processing)
 *
 * In Phase 3, this runs synchronously. In production, this would enqueue to a job queue.
 */
export async function scheduleConsolidation(callId: string) {
  // Phase 3: Run synchronously (simple, matches today's debounce)
  // TODO: Phase 3 production: enqueue to job queue (Bull, etc.)
  setTimeout(() => {
    consolidateCall(callId).catch((err) => {
      logger.error({ err, callId }, "consolidator: scheduled consolidation failed");
    });
  }, 1000); // 1 second delay to allow database to settle
}

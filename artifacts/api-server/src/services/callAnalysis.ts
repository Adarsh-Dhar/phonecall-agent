import { prisma } from "@workspace/db-prisma";
import { generateOrchestratorText, type OrchestratorTextTurn } from "./nebiusText";
import { logger } from "../lib/logger";
import { slugify } from "../lib/utils";
import { extractJsonObject } from "../lib/extractJson";

export function buildCallTimeContext(tz: string, now = new Date()): string {
  const defaultTz = process.env.DEFAULT_TIMEZONE || "Asia/Kolkata";
  const effectiveTz = (() => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    } catch {
      return defaultTz;
    }
  })();

  const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: effectiveTz, weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeFormatter = new Intl.DateTimeFormat("en-US", { timeZone: effectiveTz, hour: "numeric", minute: "numeric", hour12: true });
  const tzFormatter = new Intl.DateTimeFormat("en-US", { timeZone: effectiveTz, timeZoneName: "long" });

  const dateStr = dateFormatter.format(now);
  const timeStr = timeFormatter.format(now);
  const tzName = tzFormatter.formatToParts(now).find((p) => p.type === "timeZoneName")?.value || effectiveTz;

  return `CURRENT DATE AND TIME: ${dateStr}, ${timeStr} (${tzName}). Resolve "today/tomorrow/next Tuesday" against this and repeat the exact calendar date back to confirm.`;
}

function buildBaseCallInstruction(
  contactName: string,
  knowledgeFacts: Array<{ category: string; key: string; value: string }> = [],
  taskContext: { title: string; description: string | null } | null = null,
  timezone: string
): string {
  const knowledgeBlock =
    knowledgeFacts.length > 0
      ? "\n\nWhat you already know about this contact:\n" +
        knowledgeFacts.map((f) => `- (${f.category}) ${f.key}: ${f.value}`).join("\n") +
        "\n\nUse these facts when relevant instead of asking the other person to repeat them. They were noted from earlier conversations and may be out of date: if the other person contradicts one, accept their version, do not argue, and mention the discrepancy in your end_call summary."
      : "";

  const taskBlock = taskContext
    ? `\n\nTHE REASON FOR THIS CALL: You are calling specifically to resolve this: "${taskContext.title}"` +
      (taskContext.description ? ` — ${taskContext.description}` : "") +
      " Open the call by getting straight to this, and keep the conversation focused on it."
    : "";

  const timeContext = buildCallTimeContext(timezone);

  return (
    timeContext +
      "\n\n" +
      "Reply in whatever language the other person speaks (English, Hindi, Odia).\n\n" +
      "GETTING PRECISE INFORMATION: If the call involves scheduling, rescheduling, or referencing any " +
      "appointment or follow-up, always pin down an exact date AND time before moving on — never accept " +
      "a vague answer like \"sometime next week,\" \"in the morning,\" or \"I'll get back to you\" without " +
      "a direct follow-up asking for a specific day and time. The same applies to any other detail you " +
      "need to act on — reference numbers, claim or order IDs, addresses, names — ask for the exact value " +
      "rather than accepting a vague or partial one. If the other person genuinely doesn't have it on hand, " +
      "confirm that plainly (so it's clear it was asked and unavailable, not skipped) before moving on.\n\n" +
      "Never agree to a fee, deposit, cancellation charge, or a time not already approved. Say 'one moment', " +
      "call ask_user, and use its answer. If it returns USER_UNAVAILABLE, tell them you'll call back, then " +
      "call end_call with outcome needs_user.\n\n" +
      "ENDING THE CALL: This call has a natural end point — don't drag it out. As soon as the purpose " +
      "of the call is resolved (the other person has said goodbye, confirmed there's nothing else, " +
      "or the conversation has clearly wound down), say a brief, warm goodbye and then call the " +
      "end_call function immediately in the same turn — do not keep chatting, ask another open-ended " +
      "question, or wait for further confirmation first. If the other person explicitly asks to end " +
      "the call or hang up, do the same right away. Never call end_call before you've said goodbye out loud. " +
      "When finished, call end_call with outcome, summary, and confirmedAt/confirmationRef if known." +
      taskBlock +
      knowledgeBlock
  );
}

function buildCallIntro(onBehalfOfName: string, contactName: string, direction: "inbound" | "outbound"): string {
  const action = direction === "inbound" ? "taking a call" : "calling";
  return (
    `You are Phone Agent, an intelligent voice assistant ${action} on behalf of ${onBehalfOfName}, ` +
    `speaking with ${contactName}. At the start say you are an AI assistant calling on behalf of ${onBehalfOfName}. ` +
    "Be warm, but direct and concise — this is a live phone conversation, not an email. Get to the point quickly, " +
    "don't pad your sentences with filler, and don't repeat back what the other person just said. If you don't have " +
    "enough information to commit to something, or the other person can't give you something you need " +
    "(e.g. a reference number or ID you don't have), say plainly that you'll need to check with " +
    `${onBehalfOfName} and get back to them — don't guess or invent details.\n\n`
  );
}

export function buildInboundCallSystemInstruction(
  onBehalfOfName: string,
  contactName: string,
  knowledgeFacts: Array<{ category: string; key: string; value: string }> = [],
  taskContext: { title: string; description: string | null } | null = null,
  timezone: string
): string {
  const intro = buildCallIntro(onBehalfOfName, contactName, "inbound");
  const baseInstruction = buildBaseCallInstruction(contactName, knowledgeFacts, taskContext, timezone);
  return intro + baseInstruction;
}

export function buildOutboundCallSystemInstruction(
  onBehalfOfName: string,
  calleeName: string,
  knowledgeFacts: Array<{ category: string; key: string; value: string }> = [],
  taskContext: { title: string; description: string | null } | null = null,
  timezone: string
): string {
  const intro = buildCallIntro(onBehalfOfName, calleeName, "outbound");
  const baseInstruction = buildBaseCallInstruction(calleeName, knowledgeFacts, taskContext, timezone);
  return intro + baseInstruction;
}

/**
 * v11: Agent call system instruction with strict role separation.
 * The AI agent ALWAYS speaks for the individual, never for the business.
 */
export function buildAgentCallSystemInstruction({
  individualName,
  businessName,
  direction,
  knowledgeFacts = [],
  taskContext = null,
  timezone,
}: {
  individualName: string;
  businessName: string;
  direction: 'inbound' | 'outbound';
  knowledgeFacts?: Array<{ category: string; key: string; value: string }>;
  taskContext?: { title: string; description: string | null } | null;
  timezone: string;
}): string {
  const action = direction === 'inbound' ? 'taking a call' : 'calling';
  const intro =
    `You are Phone Agent, an intelligent voice assistant ${action} on behalf of ${individualName}, ` +
    `speaking with ${businessName}. ` +
    (direction === 'outbound'
      ? `At the start say you are an AI assistant calling on behalf of ${individualName}. `
      : '') +
    `IMPORTANT: You represent ONLY ${individualName} — never speak as if you are ${businessName} or represent them. ` +
    `${businessName} is the human on the other end of the line; ${individualName} is the human you represent. ` +
    `Be warm, but direct and concise — this is a live phone conversation, not an email. Get to the point quickly, ` +
    `don't pad your sentences with filler, and don't repeat back what the other person just said. If you don't have ` +
    `enough information to commit to something, or the other person can't give you something you need ` +
    `(e.g. a reference number or ID you don't have), say plainly that you'll need to check with ` +
    `${individualName} and get back to them — don't guess or invent details.\n\n`;

  const baseInstruction = buildBaseCallInstruction(businessName, knowledgeFacts, taskContext, timezone);
  return intro + baseInstruction;
}

/**
 * Runs once per completed call. Reads the full transcript (Message rows
 * linked to this Call) and decides whether the agent needs to escalate to
 * the user, same decision shape as the old email flow.
 */
export async function analyzeCallForEscalation(callId: string): Promise<void> {
  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call) return;

  if (call.outcome === "booked" || call.outcome === "rescheduled" || call.outcome === "cancelled" || call.outcome === "info_gathered") {
    await prisma.call.update({ where: { id: callId }, data: { isEnoughKnowledge: true } });
    return;
  }

  const existingQuery = await prisma.query.findFirst({ where: { callId } });
  if (existingQuery) {
    await prisma.call.update({ where: { id: callId }, data: { isEnoughKnowledge: existingQuery.status === "pending" ? false : true } });
    return;
  }

  if (call.outcome === "needs_user" && call.outcomeSummary) {
    await prisma.query.create({
      data: {
        question: call.outcomeSummary,
        status: "pending",
        conversationId: call.conversationId,
        contactId: call.contactId,
        isKnowledgeGap: true,
        callId: call.id,
        knowledgeKey: slugify(call.outcomeSummary),
        knowledgeCategory: "fact",
      },
    });
    await prisma.call.update({ where: { id: callId }, data: { isEnoughKnowledge: false } });
    return;
  }

  const turns = await prisma.message.findMany({
    where: { callId },
    orderBy: { createdAt: "asc" },
  });

  if (turns.length === 0) {
    await prisma.call.update({ where: { id: callId }, data: { isEnoughKnowledge: true } });
    return;
  }

  const contact = await prisma.account.findUnique({ where: { id: call.contactId } });
  const facts = await prisma.contactKnowledge.findMany({
    where: { contactId: call.contactId, status: "active" },
    orderBy: { category: "asc" },
  });
  const task = call.taskId
    ? await prisma.task.findUnique({ where: { id: call.taskId }, select: { title: true, description: true } })
    : null;

  const knowledgeBlock =
    facts.length > 0
      ? "\n\nWhat the agent already knew about this contact:\n" +
        facts.map((f) => `- (${f.category}) ${f.key}: ${f.value}`).join("\n")
      : "";
  const taskBlock = task
    ? `\n\nTHE GOAL OF THIS CALL: "${task.title}"` + (task.description ? ` — ${task.description}` : "") +
      "\nJudge \"did the agent get what it needed\" against this goal."
    : "";

  // On a call, "user" rows are the external contact and "assistant" rows are the agent.
  // Label the speakers inside the text so the roles can't be misread.
  const transcript = turns
    .map((m) => `${m.role === "assistant" ? "AGENT" : "CONTACT"}: ${m.content}`)
    .join("\n");
  const orchestratorTurns: OrchestratorTextTurn[] = [{ role: "user", content: `Call transcript:\n${transcript}` }];

  const systemText =
    "You are reviewing the transcript of a phone call your voice agent just completed on behalf of " +
    `your user, with ${contact?.name ?? "a contact"}. AGENT is the voice agent; CONTACT is the external person. Decide TWO things:\n\n` +
    "1. Did the agent get everything it needed during the call, or does it need to escalate something to your user?\n" +
    "2. What was the outcome of the call? (booked, rescheduled, cancelled, info_gathered, needs_user, failed)\n\n" +
    "Return ONLY a JSON object, no markdown fences:\n" +
    "{\n" +
    '  "isEnoughKnowledge": boolean,   // REQUIRED\n' +
    '  "escalationQuestion": string | null,\n' +
    '  "knowledgeKey": string | null,\n' +
    '  "knowledgeCategory": string | null,\n' +
    '  "outcome": "booked" | "rescheduled" | "cancelled" | "info_gathered" | "needs_user" | "failed" | null\n' +
    "}" +
    taskBlock +
    knowledgeBlock;

  const validOutcomes = ["booked", "rescheduled", "cancelled", "info_gathered", "needs_user", "failed"] as const;
  let decided = false;
  let isEnoughKnowledge = true;
  let escalationQuestion: string | null = null;
  let knowledgeKey: string | null = null;
  let knowledgeCategory: string | null = null;
  let llmOutcome: string | null = null;

  for (let attempt = 0; attempt < 2 && !decided; attempt++) {
    try {
      const { text } = await generateOrchestratorText({
        systemInstructionText: systemText,
        turns: orchestratorTurns,
        jsonResponse: true,
        temperature: 0.1,
        maxTokens: 700,
        purpose: "call_analysis",
      });
      const parsed = extractJsonObject(text) as {
        isEnoughKnowledge?: unknown;
        escalationQuestion?: unknown;
        knowledgeKey?: unknown;
        knowledgeCategory?: unknown;
        outcome?: unknown;
      };
      // A missing verdict is a failed parse, not "enough knowledge".
      if (typeof parsed.isEnoughKnowledge !== "boolean") {
        throw new SyntaxError("isEnoughKnowledge missing or not a boolean");
      }
      isEnoughKnowledge = parsed.isEnoughKnowledge;
      if (!isEnoughKnowledge) {
        escalationQuestion =
          (typeof parsed.escalationQuestion === "string" && parsed.escalationQuestion.trim()) ||
          `The call with ${contact?.name ?? "the contact"} needs your input — can you review the transcript?`;
        knowledgeKey = slugify((typeof parsed.knowledgeKey === "string" && parsed.knowledgeKey) || escalationQuestion);
        knowledgeCategory = (typeof parsed.knowledgeCategory === "string" && parsed.knowledgeCategory.trim()) || "fact";
      }
      llmOutcome =
        typeof parsed.outcome === "string" && (validOutcomes as readonly string[]).includes(parsed.outcome)
          ? parsed.outcome
          : null;
      decided = true;
    } catch (err) {
      logger.warn({ err, callId, attempt }, "callAnalysis: failed to get a valid escalation decision");
    }
  }

  if (!decided) {
    // Both attempts failed: don't leave the call unreviewed — ask the owner to look.
    isEnoughKnowledge = false;
    escalationQuestion = `The call with ${contact?.name ?? "the contact"} could not be analysed automatically — can you review the transcript?`;
    knowledgeKey = slugify(`review-call-${callId}`);
    knowledgeCategory = "fact";
    logger.error({ callId }, "callAnalysis: analysis failed twice, escalating for manual review");
  }

  await prisma.call.update({
    where: { id: callId },
    data: {
      isEnoughKnowledge,
      // Only fill the outcome if the agent didn't report one; callLifecycle applies it to the task afterwards.
      outcome: call.outcome || llmOutcome,
    },
  });

  if (!isEnoughKnowledge && escalationQuestion) {
    const existing = knowledgeKey
      ? await prisma.query.findFirst({ where: { knowledgeKey, status: "pending", contactId: call.contactId } })
      : null;

    if (!existing) {
      await prisma.query.create({
        data: {
          question: escalationQuestion,
          status: "pending",
          conversationId: call.conversationId,
          contactId: call.contactId,
          isKnowledgeGap: true,
          knowledgeKey,
          knowledgeCategory,
          callId: call.id,
        },
      });
      logger.info({ callId, question: escalationQuestion }, "callAnalysis: created escalation query");
    }
  }
}
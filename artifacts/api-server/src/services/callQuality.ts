import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { analyzeCallGoal } from "./callAnalysis";
import { generateOrchestratorText, type OrchestratorTextTurn } from "./nebiusText";
import { extractJsonObject } from "../lib/extractJson";

export interface PromptLesson {
  id: string;
  code: string;
  text: string;
  seenCount: number;
  appliedCount: number;
  expiresAt: Date;
}

/**
 * Load active lessons for an owner, optionally filtered to a contact.
 * Only renders lessons that have been seen at least twice (seenCount >= 2).
 * Includes both global lessons (contactId null) and contact-specific lessons.
 */
export async function loadLessons(ownerId: string, contactId: string | null): Promise<PromptLesson[]> {
  const lessons = await prisma.promptLesson.findMany({
    where: {
      ownerId,
      status: "active",
      expiresAt: { gt: new Date() },
      seenCount: { gte: 2 },
      OR: [{ contactId: null }, contactId ? { contactId } : { id: { equals: "" } }],
    },
    select: {
      id: true,
      code: true,
      text: true,
      seenCount: true,
      appliedCount: true,
      expiresAt: true,
    },
  });
  return lessons;
}

/**
 * Mark a lesson as applied when the agent successfully uses it.
 * Called from the agent's decision logic when it follows a lesson.
 */
export async function markLessonApplied(lessonId: string): Promise<void> {
  try {
    await prisma.promptLesson.update({
      where: { id: lessonId },
      data: { appliedCount: { increment: 1 } },
    });
  } catch (err) {
    logger.error({ err, lessonId }, "callQuality: failed to mark lesson as applied");
  }
}

const MISSES = ["wrong_slot","fee_agreed_without_ask","gave_up_early","missed_info","off_task"] as const;
type MissReason = typeof MISSES[number];

/**
 * Judge a call's goal achievement using transcript analysis.
 * Returns null if LLM fails, allowing fallback to table-based scoring.
 */
export async function judgeCallGoal(callId: string): Promise<{
  goalAchieved: boolean;
  goalScore: number;
  missReason: MissReason | null;
  evidence: string | null;
} | null> {
  try {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: {
        outcome: true,
        outcomeSummary: true,
        confirmedAt: true,
        taskId: true,
      },
    });

    if (!call) return null;

    // Deterministic miss: booked/rescheduled but no confirmedAt
    if ((call.outcome === "booked" || call.outcome === "rescheduled") && !call.confirmedAt) {
      return {
        goalAchieved: false,
        goalScore: 40,
        missReason: "missed_info",
        evidence: "call outcome is booked or rescheduled but confirmedAt is null",
      };
    }

    const [task, turns, decisions, handoff, gapQuery] = await Promise.all([
      call.taskId
        ? prisma.task.findUnique({
            where: { id: call.taskId },
            select: { title: true, description: true, kind: true },
          })
        : null,
      prisma.message.findMany({
        where: { callId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.ruleDecision.findMany({
        where: { callId },
        select: { category: true, decision: true },
      }),
      prisma.handoff.findFirst({ where: { callId } }),
      prisma.query.findFirst({
        where: { callId, isKnowledgeGap: true },
      }),
    ]);

    // Excused: escalating was the CORRECT behaviour
    const excused =
      decisions.some((d) => d.decision !== "allow") || !!handoff || !!gapQuery;

    const transcript = turns
      .map((m) => `${m.role === "assistant" ? "AGENT" : "CONTACT"}: ${m.content}`)
      .join("\n");

    // Skip LLM judgment if transcript is empty
    if (!transcript || transcript.trim().length === 0) {
      logger.warn({ callId }, "callQuality: empty transcript, skipping LLM judgment");
      return null;
    }

    const system =
      `Judge whether the AGENT achieved this goal: "${task?.title ?? "none"}" ${task?.description ?? ""}.\n` +
      `Facts: outcome=${call.outcome}; standing-rule decisions=${JSON.stringify(decisions)}; owner joined live=${!!handoff}.\n` +
      `Escalating to the owner when a rule said ask/deny/handoff, or when a fact was unknown, is CORRECT, never a miss.\n` +
      `Return ONLY JSON: {"goalAchieved":bool,"goalScore":0-100,"missReason":${MISSES.map((m) => `"${m}"`).join("|")}|null,` +
      `"evidence":"an exact sentence copied from the transcript showing the miss, or null"}`;

    const { text } = await generateOrchestratorText({
      systemInstructionText: system,
      turns: [{ role: "user", content: transcript }],
      jsonResponse: true,
      temperature: 0.1,
      maxTokens: 400,
      purpose: "call_goal",
    });

    const parsed = extractJsonObject(text) as {
      goalAchieved?: unknown;
      goalScore?: unknown;
      missReason?: unknown;
      evidence?: unknown;
    };

    if (typeof parsed.goalAchieved !== "boolean" || typeof parsed.goalScore !== "number") {
      logger.warn({ callId, parsed }, "callQuality: invalid LLM response");
      return null;
    }

    let missReason: MissReason | null = null;
    let evidence: string | null = null;

    if (typeof parsed.missReason === "string" && parsed.missReason) {
      const mr = parsed.missReason as string;
      if (MISSES.includes(mr as MissReason)) {
        missReason = mr as MissReason;
      }
    }

    // Evidence check: must be in transcript
    if (parsed.evidence && typeof parsed.evidence === "string") {
      const ev = parsed.evidence.trim();
      const normalizedTranscript = transcript.toLowerCase().replace(/\s+/g, " ");
      const normalizedEvidence = ev.toLowerCase().replace(/\s+/g, " ");
      if (normalizedTranscript.includes(normalizedEvidence)) {
        evidence = ev;
      } else {
        // Evidence not found, discard miss reason
        missReason = null;
      }
    }

    // Excused calls: force missReason null and minimum score 65
    if (excused) {
      missReason = null;
      const finalScore = Math.max(65, Math.min(100, parsed.goalScore as number));
      return {
        goalAchieved: parsed.goalAchieved as boolean,
        goalScore: finalScore,
        missReason: null,
        evidence: null,
      };
    }

    return {
      goalAchieved: parsed.goalAchieved as boolean,
      goalScore: Math.max(0, Math.min(100, parsed.goalScore as number)),
      missReason,
      evidence,
    };
  } catch (err) {
    logger.error({ err, callId }, "callQuality: failed to judge call goal");
    return null;
  }
}

/**
 * Render the lessons block for the agent's system instruction.
 */
export function renderLessonsBlock(lessons: PromptLesson[]): string {
  if (lessons.length === 0) return "";

  const lines = lessons.map((l) => `- ${l.text}`);
  return `\n\nLESSONS FROM EARLIER CALLS:\n${lines.join("\n")}`;
}

/**
 * Score a call's quality (1-100) based on goal achievement, outcome, and duration.
 * Fire-and-forget: called at call end, never blocks hangup.
 */
export async function scoreCall(callId: string): Promise<void> {
  try {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: {
        outcome: true,
        durationSec: true,
        contactId: true,
        individualId: true,
        taskId: true,
        isEnoughKnowledge: true,
      },
    });

    if (!call) return;

    // Try LLM-based goal judgment first, fall back to table
    const llmResult = await judgeCallGoal(callId);
    const goalAnalysis = llmResult ?? await analyzeCallGoal(callId);

    let score = goalAnalysis.goalScore;

    // Small adjustment for knowledge: did the agent get what it needed without escalation?
    if (call.isEnoughKnowledge === true) score += 5;
    else if (call.isEnoughKnowledge === false) score -= 5;

    // Clamp to 1-100
    score = Math.max(1, Math.min(100, score));

    await prisma.call.update({
      where: { id: callId },
      data: {
        qualityScore: score,
        qualityAt: new Date(),
        qualityJson: {
          source: llmResult ? "llm" : "fallback",
          goalAchieved: goalAnalysis.goalAchieved,
          goalScore: goalAnalysis.goalScore,
          missReason: goalAnalysis.missReason,
          evidence: (llmResult as any)?.evidence || null,
          outcome: call.outcome,
          durationSec: call.durationSec,
          isEnoughKnowledge: call.isEnoughKnowledge,
        },
      },
    });

    logger.info({ callId, score, outcome: call.outcome, goalAchieved: goalAnalysis.goalAchieved, source: llmResult ? "llm" : "fallback" }, "callQuality: scored call");
  } catch (err) {
    logger.error({ err, callId }, "callQuality: failed to score call");
  }
}

/**
 * Extract lessons from a call based on quality score and miss reason.
 * Low-quality or failed calls may generate a lesson to improve future behavior.
 * Only creates lessons when source is "llm" and missReason is in the allowlist.
 * Lessons are global (contactId null) to apply across all contacts.
 * Lesson text is learned from the transcript using the evidence field.
 */
export async function extractLessonsFromCall(callId: string): Promise<void> {
  try {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: {
        qualityScore: true,
        qualityJson: true,
        outcome: true,
        contactId: true,
        individualId: true,
      },
    });

    if (!call || !call.qualityScore) return;

    // Only extract from calls with issues
    if (call.qualityScore >= 70) return;

    const qualityJson = call.qualityJson as Record<string, unknown> | null;
    const source = qualityJson?.source as string | null;
    const missReason = qualityJson?.missReason as string | null;
    const evidence = qualityJson?.evidence as string | null;

    // Only create lessons from LLM judgments with valid miss reasons and evidence
    if (source !== "llm" || !missReason || !MISSES.includes(missReason as MissReason) || !call.individualId) {
      return;
    }

    const lessonCode = missReason as MissReason;

    // Use evidence as lesson text, or fall back to fixed text
    let lessonText = evidence || "";
    if (!lessonText) {
      const fixedTexts: Record<MissReason, string> = {
        wrong_slot: "Verify the time slot carefully before accepting. Use check_availability and confirm the exact date and time.",
        fee_agreed_without_ask: "When the business mentions a fee or deposit, use ask_user before agreeing anything.",
        gave_up_early: "This call ended too quickly. Listen more carefully and ask clarifying questions before ending.",
        missed_info: "You agreed to a booking but did not capture the confirmation details. Always confirm the exact date, time, and reference.",
        off_task: "Stay focused on the task goal. Don't get sidetracked into unrelated topics.",
      };
      lessonText = fixedTexts[lessonCode];
    }

    // Dedupe: check if lesson already exists for this owner with code (global lessons)
    const existing = await prisma.promptLesson.findFirst({
      where: {
        ownerId: call.individualId,
        contactId: null, // Global lessons
        code: lessonCode,
      },
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    if (existing) {
      // Increment seenCount and extend expiresAt
      await prisma.promptLesson.update({
        where: { id: existing.id },
        data: {
          seenCount: existing.seenCount + 1,
          expiresAt,
        },
      });
      logger.info({ callId, lessonCode, seenCount: existing.seenCount + 1 }, "callQuality: updated existing global lesson");
    } else {
      // Create new global lesson
      await prisma.promptLesson.create({
        data: {
          ownerId: call.individualId,
          contactId: null, // Global lesson
          code: lessonCode,
          text: lessonText,
          expiresAt,
          sourceCallId: callId,
          seenCount: 1,
        },
      });
      logger.info({ callId, lessonCode }, "callQuality: extracted new global lesson");
    }
  } catch (err) {
    logger.error({ err, callId }, "callQuality: failed to extract lessons");
  }
}

import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { analyzeCallGoal } from "./callAnalysis";

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

    // Get goal-based analysis
    const goalAnalysis = await analyzeCallGoal(callId);
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
          goalAchieved: goalAnalysis.goalAchieved,
          goalScore: goalAnalysis.goalScore,
          missReason: goalAnalysis.missReason,
          outcome: call.outcome,
          durationSec: call.durationSec,
          isEnoughKnowledge: call.isEnoughKnowledge,
        },
      },
    });

    logger.info({ callId, score, outcome: call.outcome, goalAchieved: goalAnalysis.goalAchieved }, "callQuality: scored call");
  } catch (err) {
    logger.error({ err, callId }, "callQuality: failed to score call");
  }
}

/**
 * Extract lessons from a call based on quality score and miss reason.
 * Low-quality or failed calls may generate a lesson to improve future behavior.
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
    const missReason = qualityJson?.missReason as string | null;

    // Map miss reason codes to lesson text
    const lessonTexts: Record<string, string> = {
      fee_not_escalated: "When the business mentions a fee or deposit, use ask_user before agreeing anything.",
      wrong_slot: "Verify the time slot carefully before accepting. Use check_availability and confirm the exact date and time.",
      gave_up_early: "This call ended too quickly. Listen more carefully and ask clarifying questions before ending.",
      unclear: "The call goal was unclear. Be more direct about what you need and persist until you get a clear answer.",
    };

    if (!missReason || !lessonTexts[missReason] || !call.individualId) return;

    const lessonCode = missReason;
    const lessonText = lessonTexts[missReason];

    // Dedupe: check if lesson already exists for this owner, contact, and code
    const existing = await prisma.promptLesson.findFirst({
      where: {
        ownerId: call.individualId,
        contactId: call.contactId,
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
      logger.info({ callId, lessonCode, seenCount: existing.seenCount + 1 }, "callQuality: updated existing lesson");
    } else {
      // Create new lesson
      await prisma.promptLesson.create({
        data: {
          ownerId: call.individualId,
          contactId: call.contactId,
          code: lessonCode,
          text: lessonText,
          expiresAt,
          sourceCallId: callId,
          seenCount: 1,
        },
      });
      logger.info({ callId, lessonCode }, "callQuality: extracted new lesson");
    }
  } catch (err) {
    logger.error({ err, callId }, "callQuality: failed to extract lessons");
  }
}

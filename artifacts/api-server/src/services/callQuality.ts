import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";

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
 */
export async function loadLessons(ownerId: string, contactId: string | null): Promise<PromptLesson[]> {
  const lessons = await prisma.promptLesson.findMany({
    where: {
      ownerId,
      status: "active",
      expiresAt: { gt: new Date() },
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
 * Score a call's quality (1-100) based on outcome, duration, and resolution.
 * Fire-and-forget: called at call end, never blocks hangup.
 */
export async function scoreCall(callId: string): Promise<void> {
  try {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: {
        outcome: true,
        durationSec: true,
        autonomous: true,
        contactId: true,
        individualId: true,
      },
    });

    if (!call) return;

    let score = 50; // baseline

    // Outcome scoring
    if (call.outcome === "booked") score += 30;
    else if (call.outcome === "rescheduled") score += 20;
    else if (call.outcome === "cancelled") score += 10;
    else if (call.outcome === "info_gathered") score += 15;
    else if (call.outcome === "needs_user") score -= 10;
    else if (call.outcome === "failed") score -= 30;

    // Duration sanity: too short (< 10s) or too long (> 10min) penalizes
    if (call.durationSec) {
      if (call.durationSec < 10) score -= 20;
      else if (call.durationSec > 600) score -= 10;
      else if (call.durationSec > 30 && call.durationSec < 300) score += 5; // sweet spot
    }

    // Agent mode bonus: autonomous calls that succeed are impressive
    if (call.autonomous && (call.outcome === "booked" || call.outcome === "rescheduled")) {
      score += 10;
    }

    // Clamp to 1-100
    score = Math.max(1, Math.min(100, score));

    await prisma.call.update({
      where: { id: callId },
      data: {
        qualityScore: score,
        qualityAt: new Date(),
        qualityJson: {
          outcome: call.outcome,
          durationSec: call.durationSec,
          autonomous: call.autonomous,
        },
      },
    });

    logger.info({ callId, score, outcome: call.outcome }, "callQuality: scored call");
  } catch (err) {
    logger.error({ err, callId }, "callQuality: failed to score call");
  }
}

/**
 * Extract lessons from a call based on quality score and outcome.
 * Low-quality or failed calls may generate a lesson to improve future behavior.
 */
export async function extractLessonsFromCall(callId: string): Promise<void> {
  try {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: {
        qualityScore: true,
        outcome: true,
        contactId: true,
        individualId: true,
        conversationId: true,
      },
    });

    if (!call || !call.qualityScore) return;

    // Only extract from calls with issues
    if (call.qualityScore >= 70) return;

    const messages = await prisma.message.findMany({
      where: { callId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const transcript = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

    // Simple heuristics for lesson extraction
    let lessonCode = "";
    let lessonText = "";

    if (call.outcome === "needs_user" && transcript.toLowerCase().includes("fee")) {
      lessonCode = "fee_escalation";
      lessonText = "When the business mentions a fee or deposit, use ask_user before agreeing anything.";
    } else if (call.outcome === "needs_user" && transcript.toLowerCase().includes("personal")) {
      lessonCode = "personal_info_protection";
      lessonText = "Never share personal information without explicit approval from your user.";
    } else if (call.outcome === "failed" && call.qualityScore < 40) {
      lessonCode = "failed_call_analysis";
      lessonText = "This call ended without resolution. Listen more carefully and ask clarifying questions.";
    }

    if (lessonCode && lessonText && call.individualId) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await prisma.promptLesson.create({
        data: {
          ownerId: call.individualId,
          contactId: call.contactId,
          code: lessonCode,
          text: lessonText,
          expiresAt,
          sourceCallId: callId,
        },
      });

      logger.info({ callId, lessonCode }, "callQuality: extracted lesson");
    }
  } catch (err) {
    logger.error({ err, callId }, "callQuality: failed to extract lessons");
  }
}

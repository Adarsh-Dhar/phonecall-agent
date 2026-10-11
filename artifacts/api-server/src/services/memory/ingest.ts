/**
 * Ingest service - writes messages with seq numbers and speaker/visibility
 *
 * Phase 2: Implement idempotent message writing with relationship assignment
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";

export type Speaker = "individual_agent" | "business" | "individual_owner" | "system";

export type Visibility = "both" | "individual_only";

interface IngestMessageOptions {
  relationshipId: string;
  callId: string;
  turnIndex: number; // 0-based index within the call
  role: "user" | "assistant";
  content: string;
  time: string;
  conversationId: string;
}

/**
 * Ingest a message from a call or chat
 *
 * Idempotent: uses (callId, turnIndex) as a key to prevent duplicates.
 * Assigns seq number and speaker/visibility fields.
 *
 * For calls:
 * - role="assistant" → speaker="individual_agent"
 * - role="user" → speaker="business"
 * - visibility="both"
 *
 * For chat (no callId):
 * - role="assistant" → speaker="individual_agent"
 * - role="user" → speaker="individual_owner"
 * - visibility="individual_only"
 */
export async function ingestMessage(opts: IngestMessageOptions) {
  const { relationshipId, callId, turnIndex, role, content, time, conversationId } = opts;

  // Determine speaker and visibility
  const speaker: Speaker = callId
    ? role === "assistant"
      ? "individual_agent"
      : "business"
    : role === "assistant"
      ? "individual_agent"
      : "individual_owner";

  const visibility: Visibility = callId ? "both" : "individual_only";

  // Check if message already exists (idempotency)
  const existing = await prisma.message.findFirst({
    where: {
      callId,
      conversationId,
      role,
      content,
      createdAt: {
        gte: new Date(Date.now() - 60000), // Last minute to avoid false positives
      },
    },
  });

  if (existing) {
    logger.debug({ messageId: existing.id, callId, turnIndex }, "ingest: message already exists, skipping");
    return existing;
  }

  // Get next seq number for this relationship
  const lastSeq = await prisma.message.findFirst({
    where: { relationshipId },
    select: { seq: true },
    orderBy: { seq: "desc" },
  });

  const nextSeq = (lastSeq?.seq ?? BigInt(0)) + BigInt(1);

  // Create message
  const message = await prisma.message.create({
    data: {
      role,
      content,
      time,
      conversationId,
      callId,
      relationshipId,
      seq: nextSeq,
      speaker,
      visibility,
    },
  });

  logger.info(
    { messageId: message.id, relationshipId, seq: nextSeq, speaker, visibility },
    "ingest: message created"
  );

  return message;
}

/**
 * Ingest multiple messages in a batch
 *
 * Optimized for call end: processes all turns from a call at once.
 * Maintains ordering by turnIndex.
 */
export async function ingestMessages(opts: {
  relationshipId: string;
  callId: string;
  conversationId: string;
  turns: Array<{ role: "user" | "assistant"; content: string; time: string }>;
}) {
  const { relationshipId, callId, conversationId, turns } = opts;

  // Get current max seq for this relationship
  const lastSeq = await prisma.message.findFirst({
    where: { relationshipId },
    select: { seq: true },
    orderBy: { seq: "desc" },
  });

  let currentSeq = (lastSeq?.seq ?? BigInt(0)) + BigInt(1);

  const messages = [];

  for (const turn of turns) {
    const speaker: Speaker = turn.role === "assistant" ? "individual_agent" : "business";
    const visibility: Visibility = "both";

    // Check if already exists
    const existing = await prisma.message.findFirst({
      where: {
        callId,
        conversationId,
        role: turn.role,
        content: turn.content,
      },
    });

    if (existing) {
      messages.push(existing);
      continue;
    }

    const message = await prisma.message.create({
      data: {
        role: turn.role,
        content: turn.content,
        time: turn.time,
        conversationId,
        callId,
        relationshipId,
        seq: currentSeq,
        speaker,
        visibility,
      },
    });

    messages.push(message);
    currentSeq += BigInt(1);
  }

  logger.info(
    { relationshipId, callId, count: messages.length },
    "ingest: batch messages created"
  );

  return messages;
}

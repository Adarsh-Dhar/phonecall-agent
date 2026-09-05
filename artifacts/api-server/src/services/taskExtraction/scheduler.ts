import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";
import { DEBOUNCE_MS, HARD_CAP_MESSAGES } from "./config";
import { runExtraction } from "./runExtraction";

// ---------------------------------------------------------------------------
// In-process debounce state
// ---------------------------------------------------------------------------

interface PendingExtraction {
  timer: ReturnType<typeof setTimeout>;
  pendingCount: number;
}

const pending = new Map<string, PendingExtraction>();

/**
 * Called after every new message is persisted. Resets the debounce timer for
 * the conversation. If the pending message count hits HARD_CAP_MESSAGES, fires
 * immediately instead of waiting.
 */
export function scheduleExtraction(conversationId: string): void {
  const existing = pending.get(conversationId);

  if (existing) {
    clearTimeout(existing.timer);
    existing.pendingCount += 1;

    if (existing.pendingCount >= HARD_CAP_MESSAGES) {
      pending.delete(conversationId);
      void runExtraction(conversationId);
      return;
    }
  }

  const entry: PendingExtraction = {
    pendingCount: (existing?.pendingCount ?? 0) + (existing ? 0 : 1),
    timer: setTimeout(() => {
      pending.delete(conversationId);
      void runExtraction(conversationId);
    }, DEBOUNCE_MS),
  };

  pending.set(conversationId, entry);
}

/**
 * On server startup, find conversations that have messages newer than their
 * extraction cursor and schedule extraction for them. This recovers from
 * restarts that killed in-flight debounce timers.
 */
export async function sweepStaleConversations(): Promise<void> {
  try {
    // Find conversations where a message exists that is newer than the cursor
    const stale = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT DISTINCT c.id
      FROM "Conversation" c
      JOIN "Message" m ON m."conversationId" = c.id
      LEFT JOIN "Message" cursor_msg ON cursor_msg.id = c."lastExtractedMessageId"
      WHERE cursor_msg.id IS NULL
         OR m."createdAt" > cursor_msg."createdAt"
    `;
    if (stale.length > 0) {
      logger.info({ count: stale.length }, "startup sweep: scheduling extraction for stale conversations");
      for (const { id } of stale) {
        scheduleExtraction(id);
      }
    }
  } catch (err) {
    logger.warn({ err }, "startup sweep: failed");
  }
}

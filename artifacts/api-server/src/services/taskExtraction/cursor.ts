import { prisma } from "@workspace/db-prisma";
import type { TxClient } from "./types";

/**
 * Advances the conversation's extraction cursor to the latest message.
 * Accepts either the top-level prisma client or a transaction client so it
 * can be called both standalone (no actions found) and inside a transaction.
 */
export async function advanceCursor(
  client: typeof prisma | TxClient,
  conversationId: string,
  messages: Array<{ id: string }>
): Promise<void> {
  const latest = messages[messages.length - 1];
  if (!latest) return;
  await client.conversation.update({
    where: { id: conversationId },
    data: { lastExtractedMessageId: latest.id, lastExtractedAt: new Date() },
  });
}

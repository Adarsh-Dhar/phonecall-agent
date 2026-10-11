import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";
import { syncTaskToCalendar } from "../googleCalendar";
import { NebiusApiError } from "../nebiusText";
import { callOrchestratorExtraction } from "./orchestratorPrompt";
import { reconcileTaskActions } from "./reconcileTasks";
import { reconcileKnowledgeActions } from "./reconcileKnowledge";
import { advanceCursor } from "./cursor";
import { checkAndAutoEndConversation } from "./autoEnd";
import { MAX_DELTA_FAILURES, MAX_DELTA_MESSAGES } from "./config";
import { emptyExtractionResult, type ExtractionResult, type NewMessage, type TaskToSync } from "./types";

// ---------------------------------------------------------------------------
// Overlap guard + poison-delta tracking (in-process; the cursor re-check inside
// the transaction below covers multi-instance deployments)
// ---------------------------------------------------------------------------

const inFlight = new Map<string, { rerun: boolean }>();
const failures = new Map<string, { lastMessageId: string; count: number }>();

/** Thrown when another run moved the cursor while we were waiting on the model. */
class StaleCursorError extends Error {}

/** Failures that say nothing about the delta itself: outages, rate limits, auth/config. */
function isTransientOrConfig(err: unknown): boolean {
  if (err instanceof StaleCursorError) return true;
  if (err instanceof NebiusApiError) {
    if (err.retryable) return true;
    if (err.status === undefined) return true; // e.g. NEBIUS_API_KEY missing
    return [401, 403, 404, 429].includes(err.status);
  }
  return false;
}

function labelMessage(m: { role: string; callId: string | null }): Pick<NewMessage, "speaker" | "source"> {
  // On a call (phone or browser test), "user" rows are the external contact.
  // In the app chat / query answers, "user" rows are the owner.
  if (m.callId) {
    return m.role === "assistant"
      ? { speaker: "agent (on the call, for the owner)", source: "phone_call" }
      : { speaker: "contact (on the call)", source: "phone_call" };
  }
  return m.role === "assistant"
    ? { speaker: "agent (in the app chat)", source: "app_chat" }
    : { speaker: "owner (in the app)", source: "app_chat" };
}

/**
 * Runs extraction for a conversation, bypassing the debounce.
 *
 * Never runs twice concurrently for the same conversation: a call that arrives
 * while one is in flight flags a re-run and returns immediately; the running
 * loop picks up the newer messages from the same cursor afterwards.
 */
export async function runExtraction(conversationId: string): Promise<ExtractionResult> {
  const running = inFlight.get(conversationId);
  if (running) {
    running.rerun = true;
    logger.info({ conversationId }, "extraction: already running, re-run queued");
    return emptyExtractionResult();
  }

  const state = { rerun: false };
  inFlight.set(conversationId, state);
  const total = emptyExtractionResult();

  try {
    for (let pass = 0; pass < 10; pass++) {
      state.rerun = false;
      const { result, hasMore, ok } = await runExtractionOnce(conversationId);
      total.created.push(...result.created);
      total.updated.push(...result.updated);
      total.completed.push(...result.completed);
      total.cancelled.push(...result.cancelled);
      total.knowledgeUpserted.push(...result.knowledgeUpserted);
      total.knowledgeSuggested.push(...result.knowledgeSuggested);
      total.knowledgeInvalidated.push(...result.knowledgeInvalidated);
      total.skipped.push(...result.skipped);
      if (!ok) break; // don't hot-loop on a failing delta; next trigger retries
      if (!hasMore && !state.rerun) break;
    }
  } finally {
    inFlight.delete(conversationId);
  }
  return total;
}

async function runExtractionOnce(
  conversationId: string,
): Promise<{ result: ExtractionResult; hasMore: boolean; ok: boolean }> {
  logger.info({ conversationId }, "extraction: started");
  const result = emptyExtractionResult();

  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) {
    logger.warn({ conversationId }, "extraction: skipped (no API key)");
    return { result, hasMore: false, ok: true };
  }

  let deltaMessages: Awaited<ReturnType<typeof prisma.message.findMany>> = [];

  try {
    // 1. Conversation + cursor
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });
    if (!conversation) return { result, hasMore: false, ok: true };

    const userId = conversation.contact.ownerId;
    if (!userId) {
      logger.warn({ conversationId, contactId: conversation.contactId }, "extraction: contact has no owner, skipping");
      return { result, hasMore: false, ok: true };
    }
    const owner = await prisma.account.findUnique({
      where: { id: userId },
      select: { id: true, timezone: true },
    });

    // 2. Delta since the cursor (capped; the rest is handled by the next pass)
    const cursorMsg = conversation.lastExtractedMessageId
      ? await prisma.message.findUnique({ where: { id: conversation.lastExtractedMessageId } })
      : null;
    const since = cursorMsg?.createdAt ?? (conversation.lastExtractedMessageId ? new Date(0) : null);

    const fetched = await prisma.message.findMany({
      where: { conversationId, ...(since ? { createdAt: { gt: since } } : {}) },
      orderBy: { createdAt: "asc" },
      take: MAX_DELTA_MESSAGES + 1,
    });
    const hasMore = fetched.length > MAX_DELTA_MESSAGES;
    deltaMessages = fetched.slice(0, MAX_DELTA_MESSAGES);

    if (deltaMessages.length < 2) {
      logger.debug({ conversationId, delta: deltaMessages.length }, "extraction: skipped (delta < 2)");
      return { result, hasMore: false, ok: true };
    }

    // 3. Existing open tasks + known facts (so the model can update/dedupe/invalidate)
    const [openTasks, knowledge] = await Promise.all([
      prisma.task.findMany({
        where: { conversationId, status: { in: ["suggested", "open", "in_progress"] } },
        select: { id: true, title: true, description: true, dueDate: true, status: true, priority: true },
      }),
      prisma.contactKnowledge.findMany({
        where: { contactId: conversation.contactId, status: "active" },
        select: { key: true, category: true, value: true },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
    ]);

    // 4. Model call
    const { taskActions, knowledgeActions } = await callOrchestratorExtraction({
      conversationId,
      contactName: conversation.contact.name,
      contactBusiness: conversation.contact.business,
      existingTasks: openTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate?.toISOString() ?? null,
        status: t.status,
        priority: t.priority,
      })),
      existingKnowledge: knowledge,
      newMessages: deltaMessages.map((m) => ({
        id: m.id,
        ...labelMessage(m),
        content: m.content,
        time: m.time,
      })),
      timezone: owner?.timezone ?? undefined,
    });

    if (taskActions.length === 0 && knowledgeActions.length === 0) {
      await advanceCursor(prisma, conversationId, deltaMessages);
      failures.delete(conversationId);
      return { result, hasMore, ok: true };
    }

    // 5. Reconcile in one transaction
    let tasksToSync: TaskToSync[] = [];
    await prisma.$transaction(
      async (tx) => {
        // Another run (or instance) may have advanced the cursor while we waited on the model.
        const fresh = await tx.conversation.findUnique({
          where: { id: conversationId },
          select: { lastExtractedMessageId: true },
        });
        if (fresh?.lastExtractedMessageId !== conversation.lastExtractedMessageId) {
          throw new StaleCursorError("cursor moved during extraction");
        }

        const taskOutcome = await reconcileTaskActions(tx, {
          taskActions,
          conversationId,
          contactId: conversation.contactId,
          contactName: conversation.contact.name,
          contactBusiness: conversation.contact.business,
          deltaMessages,
        });
        result.created = taskOutcome.created;
        result.updated = taskOutcome.updated;
        result.completed = taskOutcome.completed;
        result.cancelled = taskOutcome.cancelled;
        tasksToSync = taskOutcome.tasksToSync;

        const knowledgeOutcome = await reconcileKnowledgeActions(tx, {
          knowledgeActions,
          contactId: conversation.contactId,
          deltaMessages,
        });
        result.knowledgeUpserted = knowledgeOutcome.knowledgeUpserted;
        result.knowledgeSuggested = knowledgeOutcome.knowledgeSuggested;
        result.skipped = [...taskOutcome.skipped, ...knowledgeOutcome.skipped];
        result.knowledgeInvalidated = knowledgeOutcome.knowledgeInvalidated;

        await advanceCursor(tx, conversationId, deltaMessages);
      },
      { timeout: 30_000 },
    );
    failures.delete(conversationId);

    // Calendar sync after commit (non-blocking)
    for (const t of tasksToSync) {
      syncTaskToCalendar({ ...t, userId }).catch((err) => {
        logger.error({ err, taskId: t.id }, "extraction: failed to sync task to calendar");
      });
    }

    logger.info(
      {
        conversationId,
        created: result.created.length,
        updated: result.updated.length,
        completed: result.completed.length,
        cancelled: result.cancelled.length,
        knowledgeUpserted: result.knowledgeUpserted.length,
        knowledgeSuggested: result.knowledgeSuggested.length,
        skipped: result.skipped.length,
        knowledgeInvalidated: result.knowledgeInvalidated.length,
      },
      "extraction: complete",
    );

    await checkAndAutoEndConversation(conversationId);
    return { result, hasMore, ok: true };
  } catch (err) {
    // The cursor stays put so the next trigger retries the same delta — unless
    // that delta keeps failing for reasons unrelated to outages/config.
    if (err instanceof StaleCursorError) {
      logger.info({ conversationId }, "extraction: cursor moved under us, dropping this pass");
      return { result: emptyExtractionResult(), hasMore: false, ok: true };
    }
    logger.error({ err, conversationId }, "extraction: failed");

    const lastId = deltaMessages[deltaMessages.length - 1]?.id;
    if (lastId && !isTransientOrConfig(err)) {
      const prev = failures.get(conversationId);
      const count = prev && prev.lastMessageId === lastId ? prev.count + 1 : 1;
      failures.set(conversationId, { lastMessageId: lastId, count });
      if (count >= MAX_DELTA_FAILURES) {
        logger.error(
          { conversationId, lastMessageId: lastId, count },
          "extraction: poison delta skipped after repeated failures — these messages were NOT extracted",
        );
        try {
          await advanceCursor(prisma, conversationId, deltaMessages);
        } catch (e) {
          logger.error({ err: e, conversationId }, "extraction: could not advance cursor past poison delta");
        }
        failures.delete(conversationId);
        return { result: emptyExtractionResult(), hasMore: true, ok: true };
      }
    }
    return { result: emptyExtractionResult(), hasMore: false, ok: false };
  }
}

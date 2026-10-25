import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";

const HANDOFF_TIMEOUT_MS = 60_000; // 60 seconds for the owner to accept

export interface HandoffRequestInfo {
  handoffId: string;
  callId: string;
  contactName: string;
  reason: string;
  summary?: string;
  expiresInMs: number;
}

let roomWatchProbe: ((callId: string) => boolean) | null = null;

/** Called by voiceStreamService to set the reachability probe. */
export function setRoomWatchProbe(probe: (callId: string) => boolean): void {
  roomWatchProbe = probe;
}

/**
 * Request a handoff: create the row, notify the owner, wait for acceptance.
 * Returns the final state (owner_joined, owner_unavailable, or timeout).
 */
export async function requestHandoff(opts: {
  callId: string;
  ownerId: string;
  contactName: string;
  reason: string;
  summary?: string;
  onRequested?: (info: HandoffRequestInfo) => void;
}): Promise<"owner_joined" | "owner_unavailable"> {
  const handoff = await prisma.handoff.create({
    data: {
      callId: opts.callId,
      ownerId: opts.ownerId,
      reason: opts.reason,
      summary: opts.summary,
      status: "requested",
    },
  });

  const info: HandoffRequestInfo = {
    handoffId: handoff.id,
    callId: opts.callId,
    contactName: opts.contactName,
    reason: opts.reason,
    summary: opts.summary,
    expiresInMs: HANDOFF_TIMEOUT_MS,
  };

  // Notify the owner via presence (if they're already in the call)
  const reachable = roomWatchProbe?.(opts.callId) ?? false;
  if (reachable && opts.onRequested) {
    opts.onRequested(info);
  }

  // Wait for acceptance or timeout
  const start = Date.now();
  while (Date.now() - start < HANDOFF_TIMEOUT_MS) {
    const updated = await prisma.handoff.findUnique({
      where: { id: handoff.id },
      select: { status: true },
    });
    if (!updated) break;
    if (updated.status === "accepted") {
      await prisma.handoff.update({
        where: { id: handoff.id },
        data: { acceptedAt: new Date() },
      });
      return "owner_joined";
    }
    if (updated.status === "declined") {
      return "owner_unavailable";
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Timeout
  await prisma.handoff.update({
    where: { id: handoff.id },
    data: { status: "expired" },
  });
  return "owner_unavailable";
}

/**
 * Owner accepts the handoff. Returns true if the handoff was still active.
 */
export async function acceptHandoff(
  handoffId: string,
  ownerId: string,
  callId: string,
  onAccepted: () => void
): Promise<boolean> {
  const handoff = await prisma.handoff.findUnique({
    where: { id: handoffId },
    select: { ownerId: true, status: true, callId: true },
  });

  if (!handoff || handoff.ownerId !== ownerId || handoff.callId !== callId) {
    return false;
  }

  if (handoff.status !== "requested") {
    return false;
  }

  await prisma.handoff.update({
    where: { id: handoffId },
    data: { status: "accepted" },
  });

  onAccepted();
  return true;
}

/**
 * Owner declines the handoff.
 */
export async function declineHandoff(handoffId: string, ownerId: string, callId: string): Promise<void> {
  await prisma.handoff.updateMany({
    where: {
      id: handoffId,
      ownerId,
      callId,
      status: "requested",
    },
    data: { status: "declined" },
  });
}

/**
 * Owner hands back to the agent. Returns the number of seconds they were live.
 */
export async function endLiveHandoff(callId: string): Promise<number | null> {
  const handoff = await prisma.handoff.findFirst({
    where: { callId, status: "accepted" },
    select: { id: true, acceptedAt: true },
  });

  if (!handoff || !handoff.acceptedAt) return null;

  const liveSec = Math.round((Date.now() - handoff.acceptedAt.getTime()) / 1000);

  await prisma.handoff.update({
    where: { id: handoff.id },
    data: {
      status: "ended",
      endedAt: new Date(),
      liveSec,
    },
  });

  return liveSec;
}

/**
 * Close all handoffs for a call (cleanup on call end).
 */
export async function closeCallHandoffs(callId: string): Promise<void> {
  await prisma.handoff.updateMany({
    where: { callId, status: { in: ["requested", "accepted"] } },
    data: { status: "ended", endedAt: new Date() },
  });
}

/**
 * Tool response format for request_human_handoff.
 */
export function handoffToolResponse(result: "owner_joined" | "owner_unavailable"): Record<string, unknown> {
  if (result === "owner_joined") {
    return { status: "owner_joined", instruction: "Stay silent until your user has left the call." };
  }
  return {
    status: "owner_unavailable",
    instruction: "Your user could not join. Do not agree to anything. Say they will follow up, then end the call with outcome needs_user.",
  };
}

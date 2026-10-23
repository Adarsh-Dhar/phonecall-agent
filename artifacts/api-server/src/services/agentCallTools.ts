/**
 * Agent call tools — what the autonomous side of the AI agent uses to SEND and RECEIVE calls.
 *
 * Why this exists: before this file the only things the model could do were the two in-call Gemini
 * tools (`end_call`, `ask_user` in geminiVoiceSession.ts). Placing a call (dialCallAs) and accepting
 * one (acceptCallAs) were only reachable from HTTP routes, i.e. from a human clicking a button.
 *
 *   SEND     agentPlaceCall()        ← used by callScheduler.ts when a task's due time arrives
 *                                      (including tasks created from Google Calendar events)
 *   RECEIVE  agentWillAutoAnswer()   ← lives in callSignaling.ts and is used by dialCallAs(): when a
 *                                      business calls an individual who enabled `agentAutoAnswer`, the
 *                                      call is created already in-progress and the agent talks for them.
 *
 * Calls stay in-app (browser mic ↔ Gemini Live). There is deliberately no carrier/PSTN path — see
 * the header of callScheduler.ts.
 */

import { logger } from "../lib/logger";
import { dialCallAs, NotInContactsError } from "./callSignaling";
import { sendToAccount } from "./presence";

export type AgentCallOutcome =
  /** The business's app is online and is ringing; the call lives on (accept → agent talks). */
  | { kind: "ringing"; callId: string }
  /** The business app was offline, so a "missed" Call row was recorded. Retry later. */
  | { kind: "missed"; callId: string }
  /** The call could not even be created (not linked, not in contacts, …). Fall back to notifying the user. */
  | { kind: "unavailable"; reason: string };

/**
 * Place an outbound call to `contactId` on behalf of the individual `ownerId`, as the AI agent.
 * Never throws: every failure is returned as { kind: "unavailable" } so the scheduler can decide.
 */
export async function agentPlaceCall(input: {
  ownerId: string;
  contactId: string;
  contactName?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
}): Promise<AgentCallOutcome> {
  const { ownerId, contactId, taskId } = input;
  try {
    const result = await dialCallAs(contactId, taskId ?? null, ownerId, "individual", { agent: true });

    if (result.status === "missed") {
      logger.info({ callId: result.call.id, contactId, taskId }, "agentPlaceCall: business offline, recorded missed call");
      return { kind: "missed", callId: result.call.id };
    }

    // Tell the owner's open tabs the agent just made a call, so they can watch the live transcript.
    sendToAccount(ownerId, {
      type: "agent_call",
      direction: "outbound",
      callId: result.call.id,
      contactName: input.contactName ?? null,
      title: input.taskTitle ?? null,
    });

    logger.info({ callId: result.call.id, contactId, taskId }, "agentPlaceCall: call placed, ringing");
    return { kind: "ringing", callId: result.call.id };
  } catch (err) {
    const reason =
      err instanceof NotInContactsError
        ? "not_in_contacts"
        : err instanceof Error
          ? err.message
          : "unknown_error";
    logger.warn({ err, contactId, taskId, reason }, "agentPlaceCall: could not place call");
    return { kind: "unavailable", reason };
  }
}

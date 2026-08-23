/**
 * Twilio Media Stream ↔ Gemini Live real-time bridge
 *
 * This module handles a single WebSocket connection from Twilio's Media Stream
 * feature.  For every call that reaches the `/media-stream` WS endpoint:
 *
 *  1. Twilio sends a `connected` event, then a `start` event containing the
 *     CallSid and StreamSid.
 *  2. We look up the Call row by CallSid to find the conversationId /
 *     contactId, then open a Gemini Live session for that call.
 *  3. Every `media` event from Twilio carries a base64 μ-law chunk.  We
 *     decode it → resample 8 kHz → 24 kHz → forward to Gemini Live as
 *     raw PCM16 via sendRealtimeInput.
 *  4. Gemini Live responds with audio (PCM16 24 kHz) and/or transcriptions.
 *     Audio is resampled 24 kHz → 8 kHz → μ-law encoded → base64 and sent
 *     back to Twilio as a `media` event.
 *  5. When Gemini signals `serverContent.interrupted` (user interrupted the
 *     model mid-sentence) we send a Twilio `clear` event to flush queued
 *     audio on that side.
 *  6. Transcript turns from both `inputTranscription` (user speech) and
 *     `outputTranscription` (model speech) are buffered per turn and
 *     persisted as `Message` rows in the same Conversation so the
 *     task-extraction pipeline can mine them.
 *  7. On WS close we update `Call.status = "completed"` and close the
 *     Gemini session cleanly.
 *
 * Twilio Media Stream event format (JSON over WS):
 *   { event: "connected" }
 *   { event: "start",   start:   { callSid, streamSid, ... } }
 *   { event: "media",   media:   { payload: "<base64 mulaw>" }, streamSid }
 *   { event: "stop",    stop:    { callSid }, streamSid }
 *   { event: "mark",    mark:    { name }, streamSid }
 *
 * Gemini Live send back to Twilio:
 *   { event: "media",  streamSid, media: { payload: "<base64 mulaw>" } }
 *   { event: "mark",   streamSid, mark:  { name: "<label>" } }
 *   { event: "clear",  streamSid }
 */

import type { IncomingMessage } from "node:http";
import { WebSocket } from "ws";
import { GoogleGenAI, Modality, type Session, type LiveServerMessage } from "@google/genai";
import { prisma } from "../db-prisma";
import { logger } from "../lib/logger";
import { twilioPayloadToPcm16, pcm16ToTwilioPayload } from "../lib/audioCodec";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Gemini Live model ID — override via env to switch to a newer model */
const LIVE_MODEL =
  process.env.GEMINI_LIVE_MODEL ?? "gemini-2.0-flash-live-001";

/** System instruction delivered to Gemini at session start */
const SYSTEM_INSTRUCTION = `You are Phone Agent, a concise and professional personal admin assistant \
making a phone call on behalf of your user.
Keep responses SHORT — no more than two sentences at a time.
Speak naturally and conversationally.
When you have achieved the task or received the needed information, wrap up politely and say goodbye.`;

// Twilio stream rates
const TWILIO_SAMPLE_RATE = 8000;
const GEMINI_SAMPLE_RATE = 24000;

// ---------------------------------------------------------------------------
// Twilio message types
// ---------------------------------------------------------------------------

interface TwilioConnectedEvent {
  event: "connected";
  protocol: string;
}

interface TwilioStartEvent {
  event: "start";
  sequenceNumber: string;
  start: {
    streamSid: string;
    callSid: string;
    accountSid: string;
    tracks: string[];
    customParameters?: Record<string, string>;
  };
  streamSid: string;
}

interface TwilioMediaEvent {
  event: "media";
  sequenceNumber: string;
  media: {
    track: string;
    chunk: string;
    timestamp: string;
    payload: string; // base64 mulaw
  };
  streamSid: string;
}

interface TwilioStopEvent {
  event: "stop";
  sequenceNumber: string;
  stop: { callSid: string; accountSid: string };
  streamSid: string;
}

interface TwilioMarkEvent {
  event: "mark";
  sequenceNumber: string;
  mark: { name: string };
  streamSid: string;
}

type TwilioEvent =
  | TwilioConnectedEvent
  | TwilioStartEvent
  | TwilioMediaEvent
  | TwilioStopEvent
  | TwilioMarkEvent;

// ---------------------------------------------------------------------------
// Bridge state per connection
// ---------------------------------------------------------------------------

interface BridgeState {
  streamSid: string;
  callSid: string;
  callId: string | null;
  conversationId: string | null;
  contactId: string | null;
  geminiSession: Session | null;
  /** Accumulates the model's output transcription for the current turn */
  outputTranscriptBuffer: string;
  /** Accumulates the user's input transcription for the current turn */
  inputTranscriptBuffer: string;
  /** Flush pending transcripts when turn is complete */
  pendingFlush: boolean;
  closed: boolean;
}

// ---------------------------------------------------------------------------
// Main entry point — called for each new WS upgrade to /media-stream
// ---------------------------------------------------------------------------

export function handleMediaStream(
  twilioWs: WebSocket,
  _req: IncomingMessage
): void {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "test_key" || apiKey === "test_key_for_testing") {
    logger.warn("mediaStream: no real Gemini API key — closing WS");
    twilioWs.close(1011, "Gemini not configured");
    return;
  }

  const state: BridgeState = {
    streamSid: "",
    callSid: "",
    callId: null,
    conversationId: null,
    contactId: null,
    geminiSession: null,
    outputTranscriptBuffer: "",
    inputTranscriptBuffer: "",
    pendingFlush: false,
    closed: false,
  };

  const ai = new GoogleGenAI({ apiKey });

  // ── Twilio WS event handler ──────────────────────────────────────────────

  twilioWs.on("message", (raw: Buffer | string) => {
    let msg: TwilioEvent;
    try {
      msg = JSON.parse(raw.toString()) as TwilioEvent;
    } catch {
      return; // ignore non-JSON frames
    }

    switch (msg.event) {
      case "connected":
        logger.debug("mediaStream: Twilio connected");
        break;

      case "start":
        void handleStart(msg, state, ai, twilioWs);
        break;

      case "media":
        handleMedia(msg, state, twilioWs);
        break;

      case "stop":
        logger.info({ callSid: state.callSid }, "mediaStream: Twilio stop event");
        void closeSession(state, twilioWs);
        break;

      case "mark":
        // No action needed — marks are sent by us and echoed back by Twilio
        break;
    }
  });

  twilioWs.on("error", (err: Error) => {
    logger.error({ err, callSid: state.callSid }, "mediaStream: Twilio WS error");
    void closeSession(state, twilioWs);
  });

  twilioWs.on("close", () => {
    void closeSession(state, twilioWs);
  });
}

// ---------------------------------------------------------------------------
// Handle "start" — look up call + open Gemini Live session
// ---------------------------------------------------------------------------

async function handleStart(
  msg: TwilioStartEvent,
  state: BridgeState,
  ai: GoogleGenAI,
  twilioWs: WebSocket
): Promise<void> {
  state.streamSid = msg.start.streamSid;
  state.callSid = msg.start.callSid;

  logger.info(
    { callSid: state.callSid, streamSid: state.streamSid },
    "mediaStream: stream started"
  );

  // Look up the Call row so we know which conversation to attach messages to
  try {
    const call = await prisma.call.findUnique({
      where: { twilioSid: state.callSid },
      include: { contact: true },
    });

    if (call) {
      state.callId = call.id;
      state.conversationId = call.conversationId;
      state.contactId = call.contactId;

      // Mark call as in_progress
      await prisma.call.update({
        where: { id: call.id },
        data: { status: "in_progress", startedAt: new Date() },
      });
    } else {
      logger.warn(
        { callSid: state.callSid },
        "mediaStream: no Call row found for CallSid — transcript will not be persisted"
      );
    }
  } catch (err) {
    logger.error({ err }, "mediaStream: DB lookup failed");
  }

  // Build the Gemini Live config
  const liveConfig = {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: "Puck" },
      },
    },
    // Request both input (user) and output (model) transcriptions
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
  };

  try {
    const session = await ai.live.connect({
      model: LIVE_MODEL,
      config: liveConfig,
      callbacks: {
        onopen: () => {
          logger.info(
            { callSid: state.callSid },
            "mediaStream: Gemini Live session opened"
          );
        },
        onmessage: (serverMsg: LiveServerMessage) => {
          handleGeminiMessage(serverMsg, state, twilioWs);
        },
        onerror: (e: ErrorEvent) => {
          logger.error(
            { callSid: state.callSid, error: e.message },
            "mediaStream: Gemini Live error"
          );
        },
        onclose: (e: CloseEvent) => {
          logger.info(
            { callSid: state.callSid, code: e.code },
            "mediaStream: Gemini Live session closed"
          );
        },
      },
    });

    state.geminiSession = session;
    logger.info({ callSid: state.callSid }, "mediaStream: Gemini Live ready");
  } catch (err) {
    logger.error({ err, callSid: state.callSid }, "mediaStream: failed to connect to Gemini Live");
    twilioWs.close(1011, "Gemini Live connection failed");
  }
}

// ---------------------------------------------------------------------------
// Handle "media" — decode μ-law, forward PCM16 to Gemini
// ---------------------------------------------------------------------------

function handleMedia(
  msg: TwilioMediaEvent,
  state: BridgeState,
  _twilioWs: WebSocket
): void {
  if (!state.geminiSession) return;

  // Only process inbound (microphone) track — Twilio also sends "outbound"
  if (msg.media.track !== "inbound") return;

  const payload = msg.media.payload;
  if (!payload) return;

  try {
    // Decode μ-law 8kHz → PCM16 24kHz
    const pcm24k = twilioPayloadToPcm16(payload, TWILIO_SAMPLE_RATE, GEMINI_SAMPLE_RATE);

    // Convert Int16Array to a Buffer, then base64 — Gemini expects raw PCM16 bytes
    const pcmBuffer = Buffer.from(pcm24k.buffer, pcm24k.byteOffset, pcm24k.byteLength);
    const b64 = pcmBuffer.toString("base64");

    state.geminiSession.sendRealtimeInput({
      audio: {
        data: b64,
        mimeType: `audio/pcm;rate=${GEMINI_SAMPLE_RATE}`,
      },
    });
  } catch (err) {
    logger.warn({ err }, "mediaStream: audio encode/send error");
  }
}

// ---------------------------------------------------------------------------
// Handle Gemini Live messages
// ---------------------------------------------------------------------------

function handleGeminiMessage(
  msg: LiveServerMessage,
  state: BridgeState,
  twilioWs: WebSocket
): void {
  const sc = msg.serverContent;
  if (!sc) return;

  // ── Barge-in: model was interrupted by user speech ───────────────────────
  if (sc.interrupted) {
    logger.debug({ callSid: state.callSid }, "mediaStream: barge-in detected — clearing Twilio queue");
    sendTwilioClear(twilioWs, state.streamSid);
    // Discard the incomplete output transcript for this interrupted turn
    state.outputTranscriptBuffer = "";
    return;
  }

  // ── Audio output from model ──────────────────────────────────────────────
  if (sc.modelTurn?.parts) {
    for (const part of sc.modelTurn.parts) {
      if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("audio/pcm")) {
        try {
          // Decode base64 → Int16Array
          const pcmBuf = Buffer.from(part.inlineData.data, "base64");
          const pcm24k = new Int16Array(
            pcmBuf.buffer,
            pcmBuf.byteOffset,
            pcmBuf.byteLength / 2
          );

          // Resample 24kHz → 8kHz → μ-law → base64
          const twilioPayload = pcm16ToTwilioPayload(pcm24k, GEMINI_SAMPLE_RATE, TWILIO_SAMPLE_RATE);

          // Send audio to Twilio
          sendTwilioMedia(twilioWs, state.streamSid, twilioPayload);
        } catch (err) {
          logger.warn({ err }, "mediaStream: audio decode/resample error");
        }
      }
    }
  }

  // ── Transcription: user speech ───────────────────────────────────────────
  if (sc.inputTranscription?.text) {
    state.inputTranscriptBuffer += sc.inputTranscription.text;
  }

  // ── Transcription: model speech ──────────────────────────────────────────
  if (sc.outputTranscription?.text) {
    state.outputTranscriptBuffer += sc.outputTranscription.text;
  }

  // ── Turn complete — flush transcript buffers to DB ───────────────────────
  if (sc.turnComplete) {
    void flushTranscripts(state);
  }
}

// ---------------------------------------------------------------------------
// Flush accumulated transcript text into Message rows
// ---------------------------------------------------------------------------

async function flushTranscripts(state: BridgeState): Promise<void> {
  if (!state.conversationId) return;

  const now = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Persist user speech transcript
  const userText = state.inputTranscriptBuffer.trim();
  if (userText) {
    try {
      await prisma.message.create({
        data: {
          role: "user",
          content: userText,
          time: now,
          pending: false,
          conversationId: state.conversationId,
          ...(state.callId ? { callId: state.callId } : {}),
        },
      });
    } catch (err) {
      logger.warn({ err }, "mediaStream: failed to persist user transcript");
    }
    state.inputTranscriptBuffer = "";
  }

  // Persist model speech transcript
  const assistantText = state.outputTranscriptBuffer.trim();
  if (assistantText) {
    try {
      await prisma.message.create({
        data: {
          role: "assistant",
          content: assistantText,
          time: now,
          pending: false,
          conversationId: state.conversationId,
          ...(state.callId ? { callId: state.callId } : {}),
        },
      });
    } catch (err) {
      logger.warn({ err }, "mediaStream: failed to persist assistant transcript");
    }
    state.outputTranscriptBuffer = "";
  }
}

// ---------------------------------------------------------------------------
// Cleanup on WS close
// ---------------------------------------------------------------------------

async function closeSession(state: BridgeState, twilioWs: WebSocket): Promise<void> {
  if (state.closed) return;
  state.closed = true;

  logger.info({ callSid: state.callSid }, "mediaStream: closing session");

  // Flush any remaining transcript turns
  await flushTranscripts(state);

  // Close Gemini session
  if (state.geminiSession) {
    try {
      state.geminiSession.close();
    } catch {
      // ignore — session may already be closed
    }
    state.geminiSession = null;
  }

  // Update Call status if we have a DB record
  if (state.callId) {
    try {
      await prisma.call.update({
        where: { id: state.callId },
        data: {
          status: "completed",
          endedAt: new Date(),
        },
      });
    } catch (err) {
      logger.warn({ err }, "mediaStream: failed to update Call status on close");
    }
  }

  // Close Twilio WS if still open
  if (twilioWs.readyState === WebSocket.OPEN) {
    twilioWs.close();
  }
}

// ---------------------------------------------------------------------------
// Twilio WS send helpers
// ---------------------------------------------------------------------------

function sendTwilioMedia(
  ws: WebSocket,
  streamSid: string,
  base64Payload: string
): void {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      event: "media",
      streamSid,
      media: { payload: base64Payload },
    })
  );
}

function sendTwilioClear(ws: WebSocket, streamSid: string): void {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ event: "clear", streamSid }));
}

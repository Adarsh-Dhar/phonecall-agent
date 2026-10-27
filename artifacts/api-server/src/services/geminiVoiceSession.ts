import { GoogleGenAI, Modality, Type } from "@google/genai";
import { logger } from "../lib/logger";
import { isTestMode } from "../lib/testMode";
import { isCalendarTool } from "./callCalendarTools";
import { handoffToolResponse } from "./handoff";

const MODEL = process.env.GEMINI_LIVE_MODEL ?? "gemini-3.8-live";
const LANGUAGE_CODE = process.env.GEMINI_LIVE_LANGUAGE_CODE ?? "en-US";

interface EndCallArgs {
  outcome: "booked" | "rescheduled" | "cancelled" | "info_gathered" | "needs_user" | "failed";
  summary: string;
  confirmedAt?: string;
  confirmationRef?: string;
  followUps?: Array<{ kind: "bring"|"pay"|"submit"|"follow_up"; title: string; dueAt?: string; details?: string }>;
}

const END_CALL = {
  name: "end_call",
  description: "Ends the phone call right now. Say goodbye first, then call this once.",
  parameters: {
    type: Type.OBJECT,
    required: ["outcome", "summary"],
    properties: {
      outcome: {
        type: Type.STRING,
        enum: ["booked", "rescheduled", "cancelled", "info_gathered", "needs_user", "failed"],
      },
      summary: { type: Type.STRING },
      confirmedAt: {
        type: Type.STRING,
        description: "REQUIRED when outcome is booked or rescheduled: ISO date-time with the UTC offset of the confirmed slot",
      },
      confirmationRef: { type: Type.STRING },
      followUps: {
        type: Type.ARRAY,
        description: "Things the OWNER must do or the BUSINESS promised, stated on this call. One entry each. Omit if none.",
        items: {
          type: Type.OBJECT,
          required: ["kind", "title"],
          properties: {
            kind: { type: Type.STRING, enum: ["bring", "pay", "submit", "follow_up"] },
            title: { type: Type.STRING },
            dueAt: { type: Type.STRING, description: "ISO date-time with offset, or YYYY-MM-DD" },
            details: { type: Type.STRING },
          },
        },
      },
    },
  },
};

const ASK_USER = {
  name: "ask_user",
  description:
    "Ask your user a question you cannot answer. Say 'one moment please' first. Use before agreeing to any fee or deposit, or to a time you could not verify with check_availability. If the question is about a knowledge gap, provide a short snake_case knowledgeKey (3-41 characters, starts with a letter, only lowercase letters, numbers, and underscores).",
  parameters: {
    type: Type.OBJECT,
    required: ["question"],
    properties: {
      question: { type: Type.STRING },
      knowledgeKey: {
        type: Type.STRING,
        description: "Short snake_case key for this knowledge (3-41 chars, starts with letter, only lowercase letters, numbers, underscores). Reuse existing keys when possible.",
      },
      knowledgeCategory: { type: Type.STRING },
    },
  },
};

const CHECK_AVAILABILITY = {
  name: "check_availability",
  description:
    "Check whether your user is free at a time the other person just offered. Call this BEFORE agreeing to any specific day and time. Returns free true/false; when busy it returns alternatives you can offer instead. If it returns an error, retry once with a corrected startsAt, otherwise fall back to ask_user.",
  parameters: {
    type: Type.OBJECT,
    required: ["startsAt"],
    properties: {
      startsAt: { type: Type.STRING, description: "Start of the offered slot: ISO 8601 date-time WITH the UTC offset, in the future" },
      durationMin: { type: Type.NUMBER, description: "Length in minutes. Omit for a normal appointment (60)." },
    },
  },
};

const HOLD_SLOT = {
  name: "hold_slot",
  description:
    "Tentatively reserve a slot on your user's calendar while you finish the call. Call it once check_availability says the time is free, then confirm the slot with the other person. Holds are released automatically if the call does not end booked.",
  parameters: {
    type: Type.OBJECT,
    required: ["startsAt"],
    properties: {
      startsAt: { type: Type.STRING, description: "Start of the slot: ISO 8601 date-time WITH the UTC offset" },
      durationMin: { type: Type.NUMBER },
      label: { type: Type.STRING, description: "Short label, e.g. the business name and purpose" },
    },
  },
};

const CHECK_APPROVAL = {
  name: "check_approval",
  description:
    "Check your user's standing rules BEFORE you agree to a time slot, a payment, fee or deposit, sharing personal details, or any commitment. Returns decision allow, deny, ask or handoff plus what to do next. Follow it exactly. If it returns an error, treat it as ask.",
  parameters: {
    type: Type.OBJECT,
    required: ["category"],
    properties: {
      category: { type: Type.STRING, enum: ["scheduling", "money", "personal_info", "commitment", "other"] },
      startsAt: { type: Type.STRING, description: "scheduling only: start of the offered slot, ISO 8601 WITH the UTC offset, in the future" },
      durationMin: { type: Type.NUMBER, description: "scheduling only: length in minutes" },
      amount: { type: Type.NUMBER, description: "money only: the amount being asked for" },
      currency: { type: Type.STRING, description: "money only: 3-letter currency code, e.g. USD" },
      description: { type: Type.STRING, description: "What exactly is being asked, in a few words (for personal_info say which detail)" },
    },
  },
};

const REQUEST_HUMAN_HANDOFF = {
  name: "request_human_handoff",
  description:
    "Patch your user into this live call so they can speak to the other person directly. Use it when the stakes are high: a payment or commitment your rules send to your user, an identity check you cannot pass, or the other person insists on speaking with your user. Say 'one moment, I'm connecting [your user]' FIRST. Returns owner_joined (then stay silent) or owner_unavailable (then end the call with needs_user).",
  parameters: {
    type: Type.OBJECT,
    required: ["reason"],
    properties: {
      reason: { type: Type.STRING, description: "One short sentence your user will read on their phone: why they are needed" },
      summary: { type: Type.STRING, description: "Two sentences of context so they can pick up mid-conversation" },
    },
  },
};

export interface GeminiVoiceSession {
  sendAudio: (pcm24k: Int16Array) => void;
  /** Injects a text message into the live conversation (e.g. "your user has left, resume"). */
  sendText?: (text: string) => void;
  close: () => void;
}

export async function openGeminiLiveSession(opts: {
  /** Used only by the test-mode fake driver to address a session from /_test/gemini/:callId. */
  callId?: string;
  systemInstructionText: string;
  onAudioOut: (pcm24k: Int16Array) => void;
  onUserTurnText: (text: string) => void;
  onAgentTurnText: (text: string) => void;
  onAskUser?: (args: { question: string; knowledgeKey?: string; knowledgeCategory?: string }) => Promise<string>;
  /** Runs check_availability / hold_slot. Must resolve (never reject) with the tool response. */
  onToolCall?: (name: string, args: any) => Promise<unknown>;
  /** request_human_handoff. Resolves with the tool response; absent = handoff not supported here. */
  onHandoff?: (args: { reason: string; summary?: string }) => Promise<Record<string, unknown>>;
  onEndCallRequested?: (args: EndCallArgs) => void;
  onClosed?: () => void;
}): Promise<GeminiVoiceSession> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  logger.info({ apiKeyLength: apiKey.length, model: MODEL }, "geminiVoiceSession: opening session");

  const client = new GoogleGenAI({ apiKey }) as any;

  let userTurnBuffer = "";
  let agentTurnBuffer = "";
  let sessionClosed = false;
  let closedByUs = false;
  // Set once the model calls end_call. We don't hang up mid-sentence — we
  // wait for the current turn (the goodbye) to finish streaming first, with
  // a fallback timer in case turnComplete never arrives.
  let endCallPending = false;
  let endCallFired = false; // guards against double-fire from turnComplete + fallback timer
  let endCallFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let endCallArgs: EndCallArgs | null = null;

  function requestEndCall() {
    if (endCallFired) return;
    endCallFired = true;
    if (endCallFallbackTimer) clearTimeout(endCallFallbackTimer);
    opts.onEndCallRequested?.(endCallArgs || { outcome: "failed", summary: "No reason provided" });
  }

  try {
    const session = await client.live.connect({
      model: MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: { parts: [{ text: opts.systemInstructionText }] },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: { languageCode: LANGUAGE_CODE },
        tools: [{ functionDeclarations: [END_CALL, ASK_USER, CHECK_AVAILABILITY, HOLD_SLOT, CHECK_APPROVAL, REQUEST_HUMAN_HANDOFF] }],
      },
      callbacks: {
        onmessage: async (msg) => {
          if (sessionClosed) return;

          if (msg.toolCall?.functionCalls?.length) {
            const functionResponses = await Promise.all(
              msg.toolCall.functionCalls.map(async (fc) => {
                if (fc.name === "end_call") {
                  endCallArgs = fc.args as unknown as EndCallArgs;
                  endCallPending = true;
                  // Safety net: if turnComplete never arrives (e.g. the model
                  // considers the goodbye audio already sent), hang up anyway
                  // after a short grace period instead of leaving the call open.
                  if (endCallFallbackTimer) clearTimeout(endCallFallbackTimer);
                  endCallFallbackTimer = setTimeout(() => requestEndCall(), 4000);
                  return { id: fc.id, name: fc.name, response: { result: "ok" } };
                }
                if (fc.name === "ask_user") {
                  const answer = await opts.onAskUser?.(fc.args as any).catch(() => "USER_UNAVAILABLE");
                  return { id: fc.id, name: fc.name, response: { answer: answer ?? "USER_UNAVAILABLE" } };
                }
                if (fc.name === "request_human_handoff") {
                  const result = opts.onHandoff
                    ? await opts.onHandoff(fc.args as any).catch(() => handoffToolResponse("owner_unavailable"))
                    : handoffToolResponse("owner_unavailable");
                  return { id: fc.id, name: fc.name, response: result };
                }
                if (fc.name && (isCalendarTool(fc.name) || fc.name === "check_approval")) {
                  const result = await opts
                    .onToolCall?.(fc.name, fc.args ?? {})
                    .catch(() => ({ error: "calendar_unavailable" }));
                  return { id: fc.id, name: fc.name, response: (result ?? { error: "calendar_unavailable" }) as Record<string, unknown> };
                }
                return { id: fc.id, name: fc.name, response: { error: "unknown tool" } };
              })
            );
            try {
              session.sendToolResponse({ functionResponses });
            } catch (err) {
              logger.error({ err }, "geminiVoiceSession: failed to send tool response");
            }
          }

          const inputTranscription = msg.serverContent?.inputTranscription?.text;
          if (inputTranscription) {
            userTurnBuffer += inputTranscription;
          }

          const outputTranscription = msg.serverContent?.outputTranscription?.text;
          if (outputTranscription) {
            agentTurnBuffer += outputTranscription;
          }

          const audioPart = msg.serverContent?.modelTurn?.parts?.find((p) => p.inlineData?.data);
          if (audioPart?.inlineData?.data) {
            const buf = Buffer.from(audioPart.inlineData.data, "base64");
            const pcm24k = new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 2));
            opts.onAudioOut(pcm24k);
          }

          if (msg.serverContent?.turnComplete) {
            const userText = userTurnBuffer.trim();
            const agentText = agentTurnBuffer.trim();

            if (userText) {
              opts.onUserTurnText(userText);
            }
            userTurnBuffer = "";

            if (agentText) {
              opts.onAgentTurnText(agentText);
            }
            agentTurnBuffer = "";

            if (endCallPending) requestEndCall();
          }
        },
        onerror: (err) => {
          logger.error({ err }, "geminiVoiceSession: live session error");
          if (err instanceof Error) {
            logger.error({ errorMessage: err.message, errorStack: err.stack }, "geminiVoiceSession: error details");
          } else {
            logger.error({ errorMessage: String(err) }, "geminiVoiceSession: error details");
          }
        },
        onclose: () => {
          sessionClosed = true;
          if (!closedByUs) opts.onClosed?.();
        },
      },
    });

    logger.info("geminiVoiceSession: session opened successfully");

    return {
      sendAudio: (pcm24k: Int16Array) => {
        if (sessionClosed) {
          return;
        }
        try {
          session.sendRealtimeInput({
            audio: { data: Buffer.from(pcm24k.buffer, pcm24k.byteOffset, pcm24k.byteLength).toString("base64"), mimeType: "audio/pcm;rate=24000" },
          });
        } catch (err) {
          logger.error({ err }, "geminiVoiceSession: failed to send audio");
        }
      },
      sendText: (text: string) => {
        if (sessionClosed) return;
        try {
          session.sendClientContent({ turns: [{ role: "user", parts: [{ text }] }], turnComplete: true });
        } catch (err) {
          logger.error({ err }, "geminiVoiceSession: failed to send text");
        }
      },
      close: () => {
        closedByUs = true;
        sessionClosed = true;
        session.close();
      },
    };
  } catch (error) {
    logger.error({ error }, "geminiVoiceSession: failed to open session");
    throw error;
  }
}
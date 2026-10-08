import { GoogleGenAI, Modality, Type } from "@google/genai";
import { logger } from "../lib/logger";

const MODEL = process.env.GEMINI_LIVE_MODEL ?? "gemini-3.8-live";
const LANGUAGE_CODE = process.env.GEMINI_LIVE_LANGUAGE_CODE ?? "en-US";

interface EndCallArgs {
  outcome: "booked" | "rescheduled" | "cancelled" | "info_gathered" | "needs_user" | "failed";
  summary: string;
  confirmedAt?: string;
  confirmationRef?: string;
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
        description: "ISO date-time if an appointment was confirmed",
      },
      confirmationRef: { type: Type.STRING },
    },
  },
};

const ASK_USER = {
  name: "ask_user",
  description:
    "Ask your user a question you cannot answer. Say 'one moment please' first. Use before agreeing to any fee, deposit, or time not already approved.",
  parameters: {
    type: Type.OBJECT,
    required: ["question"],
    properties: {
      question: { type: Type.STRING },
      knowledgeKey: { type: Type.STRING },
      knowledgeCategory: { type: Type.STRING },
    },
  },
};

export interface GeminiVoiceSession {
  sendAudio: (pcm24k: Int16Array) => void;
  close: () => void;
}

export async function openGeminiLiveSession(opts: {
  systemInstructionText: string;
  onAudioOut: (pcm24k: Int16Array) => void;
  onUserTurnText: (text: string) => void;
  onAgentTurnText: (text: string) => void;
  onAskUser?: (args: { question: string; knowledgeKey?: string; knowledgeCategory?: string }) => Promise<string>;
  onEndCallRequested?: (args: EndCallArgs) => void;
  onClosed?: () => void;
}): Promise<GeminiVoiceSession> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  logger.info({ apiKeyLength: apiKey.length, model: MODEL }, "geminiVoiceSession: opening session");

  const client = new GoogleGenAI({ apiKey });

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
        tools: [{ functionDeclarations: [END_CALL, ASK_USER] }],
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
import { GoogleGenAI, Modality } from "@google/genai";
import { logger } from "../lib/logger";

const MODEL = process.env.GEMINI_LIVE_MODEL ?? "gemini-2.0-flash-exp";
const LANGUAGE_CODE = process.env.GEMINI_LIVE_LANGUAGE_CODE ?? "en-US";

// Function declaration exposed to the model so it can end the call itself
// instead of just trailing off or waiting to be hung up on.
const END_CALL_FUNCTION_DECLARATION = {
  name: "end_call",
  description:
    "Ends the phone call right now. Call this immediately after you've said a brief goodbye, " +
    "once the purpose of the call is resolved or the other person wants to hang up. Do not call " +
    "this before you've said goodbye out loud, and do not keep talking after calling it.",
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
  onEndCallRequested?: () => void;
}): Promise<GeminiVoiceSession> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  logger.info({ apiKeyLength: apiKey.length, model: MODEL }, "geminiVoiceSession: opening session");

  const client = new GoogleGenAI({ apiKey });

  let userTurnBuffer = "";
  let agentTurnBuffer = "";
  let audioReceivedCount = 0;
  let sessionClosed = false;
  // Set once the model calls end_call. We don't hang up mid-sentence — we
  // wait for the current turn (the goodbye) to finish streaming first, with
  // a fallback timer in case turnComplete never arrives.
  let endCallPending = false;
  let endCallFired = false; // guards against double-fire from turnComplete + fallback timer
  let endCallFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  function requestEndCall() {
    if (endCallFired) return;
    endCallFired = true;
    if (endCallFallbackTimer) clearTimeout(endCallFallbackTimer);
    logger.info("geminiVoiceSession: agent requested end_call, notifying caller");
    opts.onEndCallRequested?.();
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
        tools: [{ functionDeclarations: [END_CALL_FUNCTION_DECLARATION] }],
      },
      callbacks: {
        onmessage: (msg) => {
          if (sessionClosed) return;
          
          logger.info({ messageType: msg.serverContent?.modelTurn ? "modelTurn" : "other" }, "geminiVoiceSession: received message");

          if (msg.toolCall?.functionCalls?.length) {
            const functionResponses = msg.toolCall.functionCalls.map((fc) => {
              if (fc.name === "end_call") {
                logger.info({ callArgs: fc.args }, "geminiVoiceSession: model called end_call");
                endCallPending = true;
                // Safety net: if turnComplete never arrives (e.g. the model
                // considers the goodbye audio already sent), hang up anyway
                // after a short grace period instead of leaving the call open.
                if (endCallFallbackTimer) clearTimeout(endCallFallbackTimer);
                endCallFallbackTimer = setTimeout(() => requestEndCall(), 4000);
              }
              return { id: fc.id, name: fc.name, response: { result: "ok" } };
            });
            try {
              session.sendToolResponse({ functionResponses });
            } catch (err) {
              logger.error({ err }, "geminiVoiceSession: failed to send tool response");
            }
          }
          
          const inputTranscription = msg.serverContent?.inputTranscription?.text;
          if (inputTranscription) {
            userTurnBuffer += inputTranscription;
            logger.info({ transcription: inputTranscription }, "geminiVoiceSession: input transcription");
          }

          const outputTranscription = msg.serverContent?.outputTranscription?.text;
          if (outputTranscription) {
            agentTurnBuffer += outputTranscription;
            logger.info({ transcription: outputTranscription }, "geminiVoiceSession: output transcription");
          }

          const audioPart = msg.serverContent?.modelTurn?.parts?.find((p) => p.inlineData?.data);
          if (audioPart?.inlineData?.data) {
            audioReceivedCount++;
            logger.info({ audioCount: audioReceivedCount, audioLength: audioPart.inlineData.data.length }, "geminiVoiceSession: received audio from Gemini");
            const buf = Buffer.from(audioPart.inlineData.data, "base64");
            const pcm24k = new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 2));
            opts.onAudioOut(pcm24k);
          }

          if (msg.serverContent?.turnComplete) {
            logger.info({ userText: userTurnBuffer.trim(), agentText: agentTurnBuffer.trim() }, "geminiVoiceSession: turn complete");

            // Flush agent turn immediately — outputTranscription arrives in
            // sync with the model's audio, so it's always complete by now.
            if (agentTurnBuffer.trim()) opts.onAgentTurnText(agentTurnBuffer.trim());
            agentTurnBuffer = "";

            // Flush user turn immediately as well for real-time display
            if (userTurnBuffer.trim()) opts.onUserTurnText(userTurnBuffer.trim());
            userTurnBuffer = "";

            // The goodbye turn (if any) has now fully streamed out — safe to
            // actually hang up.
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
          logger.info({ audioReceivedCount }, "geminiVoiceSession: live session closed");
          logger.info("geminiVoiceSession: this may indicate the session was terminated by the server or client");
        },
      },
    });

    logger.info("geminiVoiceSession: session opened successfully");

    return {
      sendAudio: (pcm24k: Int16Array) => {
        if (sessionClosed) {
          logger.warn("geminiVoiceSession: attempt to send audio on closed session");
          return;
        }
        logger.info({ audioLength: pcm24k.length }, "geminiVoiceSession: sending audio to Gemini");
        try {
          session.sendRealtimeInput({
            audio: { data: Buffer.from(pcm24k.buffer, pcm24k.byteOffset, pcm24k.byteLength).toString("base64"), mimeType: "audio/pcm;rate=24000" },
          });
        } catch (err) {
          logger.error({ err }, "geminiVoiceSession: failed to send audio");
        }
      },
      close: () => {
        logger.info("geminiVoiceSession: closing session manually");
        sessionClosed = true;
        session.close();
      },
    };
  } catch (error) {
    logger.error({ error }, "geminiVoiceSession: failed to open session");
    throw error;
  }
}
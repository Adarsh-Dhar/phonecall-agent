import { GoogleGenAI, Modality } from "@google/genai";
import { logger } from "../lib/logger";

const MODEL = process.env.GEMINI_LIVE_MODEL ?? "gemini-2.0-flash-exp";

export interface GeminiVoiceSession {
  sendAudio: (pcm24k: Int16Array) => void;
  close: () => void;
}

export async function openGeminiLiveSession(opts: {
  systemInstructionText: string;
  onAudioOut: (pcm24k: Int16Array) => void;
  onUserTurnText: (text: string) => void;
  onAgentTurnText: (text: string) => void;
}): Promise<GeminiVoiceSession> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  logger.info({ apiKeyLength: apiKey.length, model: MODEL }, "geminiVoiceSession: opening session");

  const client = new GoogleGenAI({ apiKey });

  let userTurnBuffer = "";
  let agentTurnBuffer = "";
  let audioReceivedCount = 0;
  let sessionClosed = false;

  try {
    const session = await client.live.connect({
      model: MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: { parts: [{ text: opts.systemInstructionText }] },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (msg) => {
          if (sessionClosed) return;
          
          logger.info({ messageType: msg.serverContent?.modelTurn ? "modelTurn" : "other" }, "geminiVoiceSession: received message");
          
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
            if (userTurnBuffer.trim()) opts.onUserTurnText(userTurnBuffer.trim());
            if (agentTurnBuffer.trim()) opts.onAgentTurnText(agentTurnBuffer.trim());
            userTurnBuffer = "";
            agentTurnBuffer = "";
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
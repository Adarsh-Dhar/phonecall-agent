import { GoogleGenAI, Modality } from "@google/genai";
import { logger } from "../lib/logger";

const MODEL = process.env.GEMINI_LIVE_MODEL ?? "gemini-2.0-flash-live-001";

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

  const client = new GoogleGenAI({ apiKey });

  let userTurnBuffer = "";
  let agentTurnBuffer = "";

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
        const inputTranscription = msg.serverContent?.inputTranscription?.text;
        if (inputTranscription) userTurnBuffer += inputTranscription;

        const outputTranscription = msg.serverContent?.outputTranscription?.text;
        if (outputTranscription) agentTurnBuffer += outputTranscription;

        const audioPart = msg.serverContent?.modelTurn?.parts?.find((p) => p.inlineData?.data);
        if (audioPart?.inlineData?.data) {
          const buf = Buffer.from(audioPart.inlineData.data, "base64");
          const pcm24k = new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 2));
          opts.onAudioOut(pcm24k);
        }

        if (msg.serverContent?.turnComplete) {
          if (userTurnBuffer.trim()) opts.onUserTurnText(userTurnBuffer.trim());
          if (agentTurnBuffer.trim()) opts.onAgentTurnText(agentTurnBuffer.trim());
          userTurnBuffer = "";
          agentTurnBuffer = "";
        }
      },
      onerror: (err) => logger.error({ err }, "geminiVoiceSession: live session error"),
      onclose: () => logger.info("geminiVoiceSession: live session closed"),
    },
  });

  return {
    sendAudio: (pcm24k: Int16Array) => {
      session.sendRealtimeInput({
        audio: { data: Buffer.from(pcm24k.buffer, pcm24k.byteOffset, pcm24k.byteLength).toString("base64"), mimeType: "audio/pcm;rate=24000" },
      });
    },
    close: () => session.close(),
  };
}
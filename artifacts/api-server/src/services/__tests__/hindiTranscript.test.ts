import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ callbacks: undefined as any }));

vi.mock('@google/genai', () => ({
  Modality: { AUDIO: 'AUDIO' },
  Type: { OBJECT: 'OBJECT', STRING: 'STRING' },
  GoogleGenAI: class {
    live = {
      connect: async (params: any) => {
        h.callbacks = params.callbacks;
        return { sendToolResponse: () => {}, sendRealtimeInput: () => {}, close: () => {} };
      },
    };
  },
}));

import { openGeminiLiveSession } from '../geminiVoiceSession';

describe('Hindi transcript preservation', () => {
  beforeEach(() => {
    h.callbacks = undefined;
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('passes Hindi user and agent turns through unchanged', async () => {
    const hindiUser = 'नमस्ते, मैं अपॉइंटमेंट बुक करना चाहता हूं';
    const hindiAgent = 'जी, कल सुबह दस बजे का समय ठीक रहेगा?';
    const onUserTurnText = vi.fn();
    const onAgentTurnText = vi.fn();

    await openGeminiLiveSession({
      systemInstructionText: 'Test instruction',
      onAudioOut: vi.fn(),
      onUserTurnText,
      onAgentTurnText,
    });

    await h.callbacks.onmessage({ serverContent: { inputTranscription: { text: hindiUser } } });
    await h.callbacks.onmessage({ serverContent: { outputTranscription: { text: hindiAgent } } });
    await h.callbacks.onmessage({ serverContent: { turnComplete: true } });

    expect(onUserTurnText).toHaveBeenCalledTimes(1);
    expect(onUserTurnText).toHaveBeenCalledWith(hindiUser);
    expect(onAgentTurnText).toHaveBeenCalledWith(hindiAgent);
  });
});

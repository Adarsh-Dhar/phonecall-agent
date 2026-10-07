import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openGeminiLiveSession } from '../geminiVoiceSession';

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
}));

describe('Hindi transcript preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('Hindi input transcription is preserved unchanged', async () => {
    const mockSession = {
      on: vi.fn(),
      close: vi.fn(),
    };

    const { GoogleGenAI } = await import('@google/genai');
    vi.mocked(GoogleGenAI).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        getGenerativeModel: vi.fn().mockReturnValue({
          session: vi.fn().mockResolvedValue(mockSession),
        }),
      }),
    } as any));

    const hindiText = 'नमस्ते, मैं अपॉइंटमेंट बुक करना चाहता हूं';
    let receivedText: string | null = null;

    const session = await openGeminiLiveSession({
      systemInstructionText: 'Test instruction',
      onAudioOut: vi.fn(),
      onUserTurnText: (text) => {
        receivedText = text;
      },
      onAgentTurnText: vi.fn(),
    });

    // Simulate receiving Hindi input transcription from Gemini
    const onHandler = mockSession.on.mock.calls.find((call) => call[0] === 'inputTranscription');
    if (onHandler && onHandler[1]) {
      const callback = onHandler[1];
      callback({ inputTranscription: hindiText });
    }

    // The Hindi text should be passed through unchanged
    expect(receivedText).toBe(hindiText);
  });
});

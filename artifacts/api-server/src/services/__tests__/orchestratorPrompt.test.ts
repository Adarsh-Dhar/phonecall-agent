import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../nebiusText', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../nebiusText')>()),
  generateOrchestratorText: vi.fn(),
}));

import { logger } from '../../lib/logger';
import { generateOrchestratorText, NebiusApiError, OrchestratorEmptyResponseError } from '../nebiusText';
import { callOrchestratorExtraction } from '../taskExtraction/orchestratorPrompt';

const SECRET = 'SECRET-TRANSCRIPT-TEXT';

const context = {
  conversationId: 'conv-1',
  contactName: 'Test Clinic',
  contactBusiness: 'Clinic',
  existingTasks: [],
  newMessages: [
    { id: 'm1', speaker: 'contact (on the call)', source: 'phone_call' as const, content: 'Please call me Tuesday at 3pm', time: '10:00' },
    { id: 'm2', speaker: 'agent (on the call, for the owner)', source: 'phone_call' as const, content: 'Sure', time: '10:01' },
  ],
};

const validPayload = {
  taskActions: [
    { type: 'create', title: 'Call back', confidence: 0.9, sourceMessageIds: ['m1'] },
    { type: 'bogus', confidence: 1, sourceMessageIds: [] }, // dropped: unknown type
    { type: 'create', title: 'No confidence', sourceMessageIds: [] }, // dropped: no confidence
  ],
  knowledgeActions: [
    { type: 'upsert', category: 'fact', key: 'hours', value: '9-5', confidence: 0.8, sourceMessageIds: ['m1'] },
    { type: 'upsert', category: 'fact', value: 'no key', confidence: 0.8, sourceMessageIds: [] }, // dropped
  ],
};

function modelReturns(text: string) {
  vi.mocked(generateOrchestratorText).mockResolvedValueOnce({
    text,
    model: 'm',
    requestedModel: 'm',
    fellBack: false,
    finishReason: 'stop',
  });
}

describe('callOrchestratorExtraction', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  const savedRaw = process.env.LOG_LLM_RAW;

  beforeEach(() => {
    vi.mocked(generateOrchestratorText).mockReset();
    for (const fn of [logger.error, logger.warn, logger.info, logger.debug]) vi.mocked(fn).mockClear();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.LOG_LLM_RAW;
  });

  afterEach(() => {
    consoleError.mockRestore();
    if (savedRaw === undefined) delete process.env.LOG_LLM_RAW;
    else process.env.LOG_LLM_RAW = savedRaw;
  });

  it('sends a low-temperature JSON-mode request through the shared client', async () => {
    modelReturns(JSON.stringify({ taskActions: [], knowledgeActions: [] }));
    await callOrchestratorExtraction(context);

    const arg = vi.mocked(generateOrchestratorText).mock.calls[0][0];
    expect(arg.jsonResponse).toBe(true);
    expect(arg.temperature).toBe(0.2);
    expect(arg.maxTokens).toBe(4096);
    expect(arg.turns).toHaveLength(1);
    expect(arg.turns[0].role).toBe('user');
    expect(arg.turns[0].content).toContain('Test Clinic');
    // conversationId is for log correlation only — never sent to the model.
    expect(JSON.stringify(arg)).not.toContain('conv-1');
    // Guard against prompt corruption (lines starting with |)
    expect(arg.systemInstructionText).not.toMatch(/^\|/m);
  });

  it('parses valid JSON and drops malformed actions', async () => {
    modelReturns(JSON.stringify(validPayload));
    const result = await callOrchestratorExtraction(context);
    expect(result.taskActions).toHaveLength(1);
    expect(result.taskActions[0].title).toBe('Call back');
    expect(result.knowledgeActions).toHaveLength(1);
    expect(result.knowledgeActions[0].key).toBe('hours');
  });

  it('parses JSON wrapped in a markdown fence', async () => {
    modelReturns('```json\n' + JSON.stringify(validPayload) + '\n```');
    const result = await callOrchestratorExtraction(context);
    expect(result.taskActions).toHaveLength(1);
  });

  it('parses JSON surrounded by conversational text', async () => {
    modelReturns('Sure! Here you go: ' + JSON.stringify(validPayload) + ' Hope that helps.');
    const result = await callOrchestratorExtraction(context);
    expect(result.knowledgeActions).toHaveLength(1);
  });

  it('treats an empty model reply as "nothing to extract" without throwing', async () => {
    vi.mocked(generateOrchestratorText).mockRejectedValueOnce(new OrchestratorEmptyResponseError("empty"));
    await expect(callOrchestratorExtraction(context)).resolves.toEqual({ taskActions: [], knowledgeActions: [] });
  });

  it.each(['reasoning_only', 'truncated'] as const)(
    'rethrows an empty reply with reason %s so the cursor is not advanced',
    async (reason) => {
      vi.mocked(generateOrchestratorText).mockRejectedValueOnce(new OrchestratorEmptyResponseError(reason));
      await expect(callOrchestratorExtraction(context)).rejects.toBeInstanceOf(OrchestratorEmptyResponseError);
    }
  );

  it('rethrows when the JSON was cut off by max_tokens instead of treating it as "nothing to extract"', async () => {
    vi.mocked(generateOrchestratorText).mockResolvedValueOnce({
      text: '{"taskActions": [',
      model: 'm',
      requestedModel: 'm',
      fellBack: false,
      finishReason: 'length',
    });
    await expect(callOrchestratorExtraction(context)).rejects.toMatchObject({ reason: 'truncated' });
  });

  it('rethrows provider failures so the caller leaves the cursor in place', async () => {
    vi.mocked(generateOrchestratorText).mockRejectedValueOnce(new NebiusApiError('rate limited', 429, 'm'));
    await expect(callOrchestratorExtraction(context)).rejects.toBeInstanceOf(NebiusApiError);
  });

  describe('unparseable model output', () => {
    // The brace slice is `{"note": SECRET...}` — invalid JSON whose V8
    // SyntaxError message quotes a snippet of the input (see the control test).
    const unparseable = `preamble ${SECRET} {"note": ${SECRET}} trailing ${SECRET}`;

    it('control: the raw JSON.parse error really would leak transcript text', () => {
      let message = '';
      try {
        JSON.parse(`{"note": ${SECRET}}`);
      } catch (e) {
        message = (e as Error).message;
      }
      expect(message).toContain('SECRET');
    });

    it('returns empty results and logs metadata only — no raw output, no console.error', async () => {
      modelReturns(unparseable);
      const result = await callOrchestratorExtraction(context);

      expect(result).toEqual({ taskActions: [], knowledgeActions: [] });
      expect(consoleError).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledTimes(1);

      const [fields, message] = vi.mocked(logger.error).mock.calls[0] as [Record<string, unknown>, string];
      expect(message).toMatch(/could not parse/);
      expect(fields).toMatchObject({
        conversationId: 'conv-1',
        rawChars: unparseable.length,
        errorName: 'SyntaxError',
      });

      // Nothing the logger received, at any level, may contain transcript text.
      const everything = JSON.stringify([
        vi.mocked(logger.error).mock.calls,
        vi.mocked(logger.warn).mock.calls,
        vi.mocked(logger.info).mock.calls,
        vi.mocked(logger.debug).mock.calls,
      ]);
      expect(everything).not.toContain(SECRET);
      expect(logger.debug).not.toHaveBeenCalled();
    });

    it('logs a truncated preview at debug level only when LOG_LLM_RAW=1', async () => {
      process.env.LOG_LLM_RAW = '1';
      const long = `{not valid json ${'x'.repeat(2000)}}`;
      modelReturns(long);
      await callOrchestratorExtraction(context);

      expect(consoleError).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledTimes(1);
      const [fields] = vi.mocked(logger.debug).mock.calls[0] as [{ rawPreview: string }, string];
      expect(fields.rawPreview).toHaveLength(500);
      expect(long.startsWith(fields.rawPreview)).toBe(true);
      // The error-level line still carries no raw text.
      expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain('xxxxx');
    });
  });
});

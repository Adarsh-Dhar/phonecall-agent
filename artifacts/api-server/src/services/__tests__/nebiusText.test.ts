import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { logger } from '../../lib/logger';
import {
  generateOrchestratorText,
  getNebiusConfig,
  NebiusApiError,
  OrchestratorEmptyResponseError,
} from '../nebiusText';

const ENV_KEYS = ['NEBIUS_API_KEY', 'NEBIUS_BASE_URL', 'NEBIUS_MODEL', 'NEBIUS_FALLBACK_MODEL'] as const;
const savedEnv: Record<string, string | undefined> = {};

function reply(status: number, body: unknown) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function ok(content: string, extra: Record<string, unknown> = {}) {
  return reply(200, { choices: [{ message: { content, ...extra } }] });
}

let fetchMock: ReturnType<typeof vi.fn>;

function sentBody(call = 0) {
  return JSON.parse(fetchMock.mock.calls[call][1].body as string);
}

describe('nebiusText (the single Nebius client)', () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    process.env.NEBIUS_API_KEY = 'test-key';
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(logger.warn).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  it('getNebiusConfig applies defaults, strips trailing slashes, and reads env at call time', () => {
    expect(getNebiusConfig()).toMatchObject({
      apiKey: 'test-key',
      baseUrl: 'https://api.tokenfactory.nebius.com/v1',
      model: 'nvidia/Nemotron-3_5-Lightning',
      fallbackModel: 'Qwen/Qwen3.5-397B-A17B',
    });

    process.env.NEBIUS_BASE_URL = 'http://localhost:9999/v1///';
    process.env.NEBIUS_MODEL = 'my/model';
    process.env.NEBIUS_FALLBACK_MODEL = 'my/fallback';
    expect(getNebiusConfig()).toMatchObject({
      baseUrl: 'http://localhost:9999/v1',
      model: 'my/model',
      fallbackModel: 'my/fallback',
    });
  });

  it('throws a clear error (and makes no request) when the API key is missing', async () => {
    delete process.env.NEBIUS_API_KEY;
    await expect(
      generateOrchestratorText({ systemInstructionText: 's', turns: [{ role: 'user', content: 'hi' }] })
    ).rejects.toThrow('NEBIUS_API_KEY is not configured.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the expected request with the default settings', async () => {
    process.env.NEBIUS_BASE_URL = 'http://localhost:9999/v1/';
    fetchMock.mockResolvedValueOnce(ok('hello'));

    const result = await generateOrchestratorText({
      systemInstructionText: 'be brief',
      turns: [{ role: 'user', content: 'hi' }],
    });

    expect(result).toEqual({ text: 'hello', model: 'nvidia/Nemotron-3_5-Lightning' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:9999/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer test-key');
    expect(sentBody()).toEqual({
      model: 'nvidia/Nemotron-3_5-Lightning',
      messages: [
        { role: 'system', content: 'be brief' },
        { role: 'user', content: 'hi' },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    });
  });

  it('adds response_format only for jsonResponse and honours temperature/maxTokens overrides', async () => {
    fetchMock.mockResolvedValueOnce(ok('{}'));
    await generateOrchestratorText({
      systemInstructionText: 's',
      turns: [{ role: 'user', content: 'x' }],
      jsonResponse: true,
      temperature: 0.2,
      maxTokens: 4096,
    });
    expect(sentBody()).toMatchObject({
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 4096,
    });
  });

  it('appends a synthetic user turn when the transcript ends on an assistant turn', async () => {
    fetchMock.mockResolvedValueOnce(ok('done'));
    await generateOrchestratorText({
      systemInstructionText: 's',
      turns: [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'goodbye' },
      ],
    });
    const messages = sentBody().messages;
    expect(messages[messages.length - 1].role).toBe('user');
    expect(messages).toHaveLength(4);
  });

  it.each([404, 400])('retries once on the fallback model after HTTP %i', async (status) => {
    process.env.NEBIUS_FALLBACK_MODEL = 'my/fallback';
    fetchMock
      .mockResolvedValueOnce(reply(status, { error: { message: 'model not found' } }))
      .mockResolvedValueOnce(ok('from fallback'));

    const result = await generateOrchestratorText({
      systemInstructionText: 's',
      turns: [{ role: 'user', content: 'hi' }],
    });

    expect(result).toEqual({ text: 'from fallback', model: 'my/fallback' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentBody(0).model).toBe('nvidia/Nemotron-3_5-Lightning');
    expect(sentBody(1).model).toBe('my/fallback');
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it.each([401, 429, 500])('does not fall back on HTTP %i and throws NebiusApiError', async (status) => {
    fetchMock.mockResolvedValueOnce(reply(status, { error: { message: 'nope' } }));

    const err = await generateOrchestratorText({
      systemInstructionText: 's',
      turns: [{ role: 'user', content: 'hi' }],
    }).catch((e) => e);

    expect(err).toBeInstanceOf(NebiusApiError);
    expect(err.status).toBe(status);
    expect(err.message).toBe('nope');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws NebiusApiError for the fallback response when both models fail', async () => {
    fetchMock
      .mockResolvedValueOnce(reply(404, { error: 'primary missing' }))
      .mockResolvedValueOnce(reply(500, { error: 'fallback broke' }));

    const err = await generateOrchestratorText({
      systemInstructionText: 's',
      turns: [{ role: 'user', content: 'hi' }],
    }).catch((e) => e);

    expect(err).toBeInstanceOf(NebiusApiError);
    expect(err.status).toBe(500);
    expect(err.model).toBe('Qwen/Qwen3.5-397B-A17B');
    expect(err.message).toBe('fallback broke');
  });

  it('still reports the HTTP status when the error body is not JSON', async () => {
    fetchMock.mockResolvedValueOnce(reply(502, '<html>Bad Gateway</html>'));
    const err = await generateOrchestratorText({
      systemInstructionText: 's',
      turns: [{ role: 'user', content: 'hi' }],
    }).catch((e) => e);
    expect(err).toBeInstanceOf(NebiusApiError);
    expect(err.status).toBe(502);
    expect(err.message).toBe('Nebius request failed (502)');
  });

  it('truncates very long provider error messages', async () => {
    fetchMock.mockResolvedValueOnce(reply(500, { error: { message: 'x'.repeat(5000) } }));
    const err = await generateOrchestratorText({
      systemInstructionText: 's',
      turns: [{ role: 'user', content: 'hi' }],
    }).catch((e) => e);
    expect(err.message.length).toBeLessThanOrEqual(300);
  });

  it('never puts prompt/transcript text into thrown errors or logs', async () => {
    const secret = 'SECRET-TRANSCRIPT-TEXT';
    fetchMock
      .mockResolvedValueOnce(reply(404, { error: { message: 'model not found' } }))
      .mockResolvedValueOnce(reply(500, { error: { message: 'boom' } }));

    const err = await generateOrchestratorText({
      systemInstructionText: secret,
      turns: [{ role: 'user', content: secret }],
    }).catch((e) => e);

    expect(String(err.message)).not.toContain(secret);
    expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain(secret);
  });

  it('prefers content, falls back to reasoning_content, and trims', async () => {
    fetchMock.mockResolvedValueOnce(ok('  the answer  ', { reasoning_content: 'thinking' }));
    expect((await generateOrchestratorText({ systemInstructionText: 's', turns: [{ role: 'user', content: 'x' }] })).text).toBe(
      'the answer'
    );

    fetchMock.mockResolvedValueOnce(ok('', { reasoning_content: ' only reasoning ' }));
    expect((await generateOrchestratorText({ systemInstructionText: 's', turns: [{ role: 'user', content: 'x' }] })).text).toBe(
      'only reasoning'
    );
  });

  it('throws OrchestratorEmptyResponseError when there is no usable text', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { choices: [{ message: { content: '   ' } }] }));
    await expect(
      generateOrchestratorText({ systemInstructionText: 's', turns: [{ role: 'user', content: 'x' }] })
    ).rejects.toBeInstanceOf(OrchestratorEmptyResponseError);

    fetchMock.mockResolvedValueOnce(reply(200, { choices: [] }));
    await expect(
      generateOrchestratorText({ systemInstructionText: 's', turns: [{ role: 'user', content: 'x' }] })
    ).rejects.toBeInstanceOf(OrchestratorEmptyResponseError);
  });
});

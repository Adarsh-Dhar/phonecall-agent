/**
 * Fake Nebius server
 *
 * OpenAI-compatible HTTP server that can be scripted to return various responses
 * for testing error handling, timeouts, and malformed data
 */

import { createServer } from 'http';
import { randomBytes } from 'crypto';

class FakeNebiusServer {
  constructor(opts = {}) {
    this.port = opts.port || 9453;
    this.server = null;
    this.requests = [];
    this.mode = 'ok';
    this.delayMs = opts.delayMs || 200;
    this.customResponse = null;
    this.inFlightCount = 0;
    this.maxInFlight = opts.maxInFlight || 8;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => this._handleRequest(req, res));

      this.server.listen(this.port, () => {
        console.log(`[FakeNebius] Listening on port ${this.port}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log(`[FakeNebius] Stopped`);
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  setMode(mode) {
    this.mode = mode;
  }

  setDelay(ms) {
    this.delayMs = ms;
  }

  setCustomResponse(response) {
    this.customResponse = response;
  }

  clearRequests() {
    this.requests = [];
  }

  getRequests() {
    return [...this.requests];
  }

  getRequestCount() {
    return this.requests.length;
  }

  getInFlightCount() {
    return this.inFlightCount;
  }

  async _handleRequest(req, res) {
    const requestId = randomBytes(8).toString('hex');
    const startTime = Date.now();

    this.inFlightCount++;

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      const request = {
        id: requestId,
        method: req.method,
        path: req.url,
        headers: req.headers,
        body: body ? JSON.parse(body) : null,
        timestamp: startTime,
      };

      this.requests.push(request);

      console.log(`[FakeNebius] Request ${requestId}: ${req.method} ${req.url} (mode=${this.mode})`);

      try {
        await this._applyDelay();
        const response = this._generateResponse(request);
        this._sendResponse(res, response);
      } catch (error) {
        console.error(`[FakeNebius] Error handling request ${requestId}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      } finally {
        this.inFlightCount--;
      }
    });
  }

  async _applyDelay() {
    if (this.mode === 'hang') {
      // Never respond
      return new Promise(() => {});
    }

    if (this.mode === 'slow') {
      await new Promise((resolve) => setTimeout(resolve, 10000));
    } else {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
  }

  _generateResponse(request) {
    const requestId = request.id;
    
    // Check in-flight cap
    if (this.inFlightCount > this.maxInFlight) {
      return {
        status: 429,
        headers: { 'Retry-After': '5' },
        body: { error: { message: 'Too many requests', type: 'rate_limit_error' } },
      };
    }

    // Custom response takes precedence
    if (this.customResponse) {
      return this.customResponse;
    }

    // Mode-based responses
    switch (this.mode) {
      case '429':
        return {
          status: 429,
          headers: { 'Retry-After': '30' },
          body: { error: { message: 'Rate limit exceeded', type: 'rate_limit_error' } },
        };

      case '500':
        return {
          status: 500,
          body: { error: { message: 'Internal server error', type: 'server_error' } },
        };

      case '401':
        return {
          status: 401,
          body: { error: { message: 'Invalid API key', type: 'authentication_error' } },
        };

      case '400-param':
        return {
          status: 400,
          body: { error: { message: 'Invalid parameter', type: 'invalid_request_error' } },
        };

      case 'model-not-found':
        return {
          status: 404,
          body: { error: { message: 'Model not found', type: 'invalid_request_error' } },
        };

      case 'fenced':
        return {
          status: 200,
          body: {
            id: `chatcmpl-${requestId}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: request.body?.model || 'fake-model',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: '```json\n<< fence >>>\n{"tasks": []}\n```',
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          },
        };

      case 'think-block':
        return {
          status: 200,
          body: {
            id: `chatcmpl-${requestId}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: request.body?.model || 'fake-model',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: '<thinking>I need to think about this...</thinking>\n{"tasks": []}',
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          },
        };

      case 'chatter':
        return {
          status: 200,
          body: {
            id: `chatcmpl-${requestId}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: request.body?.model || 'fake-model',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: 'Let me think about this... um... actually... well... I guess... {"tasks": []}',
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          },
        };

      case 'trailing-comma':
        return {
          status: 200,
          body: {
            id: `chatcmpl-${requestId}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: request.body?.model || 'fake-model',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: '{"tasks": [],}',
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          },
        };

      case 'truncated':
        return {
          status: 200,
          body: {
            id: `chatcmpl-${requestId}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: request.body?.model || 'fake-model',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: '{"tasks": [{"title": "Call',
                },
                finish_reason: 'length',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          },
        };

      case 'empty':
        return {
          status: 200,
          body: {
            id: `chatcmpl-${requestId}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: request.body?.model || 'fake-model',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: '' },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 0, total_tokens: 100 },
          },
        };

      case 'array':
        return {
          status: 200,
          body: {
            id: `chatcmpl-${requestId}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: request.body?.model || 'fake-model',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: '[]' },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 2, total_tokens: 102 },
          },
        };

      case 'bad-types':
        return {
          status: 200,
          body: {
            id: `chatcmpl-${requestId}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: request.body?.model || 'fake-model',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: '{"tasks": [{"title": 123, "due": "not-a-date"}]}',
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          },
        };

      case 'obedient-injection':
        // This mode expects the request body to contain the injection
        const injection = request.body?.injection || { tasks: [] };
        return {
          status: 200,
          body: {
            id: `chatcmpl-${requestId}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: request.body?.model || 'fake-model',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: JSON.stringify(injection),
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          },
        };

      case 'compress-50':
        // Summarizer that halves input length
        const inputMessages = request.body?.messages || [];
        const inputText = inputMessages.map((m) => m.content).join(' ');
        const summary = inputText.substring(0, Math.floor(inputText.length / 2));
        return {
          status: 200,
          body: {
            id: `chatcmpl-${requestId}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: request.body?.model || 'fake-model',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: summary,
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: inputText.length, completion_tokens: summary.length, total_tokens: inputText.length + summary.length },
          },
        };

      case 'ok':
      default:
        // Normal successful response with the real extraction schema
        // Server expects taskActions / knowledgeActions with confidence and sourceMessageIds
        return {
          status: 200,
          body: {
            id: `chatcmpl-${requestId}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: request.body?.model || 'fake-model',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: JSON.stringify({
                    taskActions: [
                      {
                        kind: 'call',
                        title: 'Test task',
                        description: 'A test task for extraction',
                        due: new Date(Date.now() + 86400000).toISOString(),
                        confidence: 0.9,
                        sourceMessageIds: [],
                      },
                    ],
                    knowledgeActions: [],
                  }),
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          },
        };
    }
  }

  _sendResponse(res, response) {
    res.writeHead(response.status, {
      'Content-Type': 'application/json',
      ...response.headers,
    });
    res.end(JSON.stringify(response.body));
  }
}

export { FakeNebiusServer };

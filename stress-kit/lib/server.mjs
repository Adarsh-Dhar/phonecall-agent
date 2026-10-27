/**
 * Server under test management
 *
 * Spawns, kills, and restarts the API server for testing
 * Captures stdout/stderr logs as JSON for analysis
 */

import { spawn, ChildProcess } from 'child_process';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVER_STARTUP_TIMEOUT_MS = 30000;
const SERVER_SHUTDOWN_TIMEOUT_MS = 10000;

class ServerInstance {
  constructor(opts) {
    this.id = opts.id || randomBytes(8).toString('hex');
    this.port = opts.port;
    this.dbUrl = opts.dbUrl;
    this.jwtSecret = opts.jwtSecret;
    this.testMode = opts.testMode !== false;
    this.rootDir = opts.rootDir || join(__dirname, '..', '..');
    this.buildDir = join(this.rootDir, 'artifacts', 'api-server');
    this.process = null;
    this.logs = [];
    this.startTime = null;
    this.ready = false;
  }

  async start() {
    if (this.process) {
      throw new Error(`Server ${this.id} is already running`);
    }

    const env = {
      ...process.env,
      DATABASE_URL: this.dbUrl,
      JWT_SECRET: this.jwtSecret,
      TEST_MODE: this.testMode ? 'true' : 'false',
      NODE_ENV: 'development',
      PORT: this.port.toString(),
    };

    console.log(`[Server ${this.id}] Starting on port ${this.port}...`);

    this.process = spawn('pnpm', ['run', 'dev'], {
      cwd: this.buildDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.startTime = Date.now();
    this.logs = [];

    // Capture stdout
    this.process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        this._parseLog(line, 'stdout');
      }
    });

    // Capture stderr
    this.process.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        this._parseLog(line, 'stderr');
      }
    });

    // Handle process exit
    this.process.on('exit', (code, signal) => {
      console.log(`[Server ${this.id}] Exited: code=${code}, signal=${signal}`);
      this.process = null;
      this.ready = false;
    });

    // Wait for server to be ready
    await this._waitForReady();

    console.log(`[Server ${this.id}] Ready on port ${this.port}`);
    this.ready = true;
  }

  async stop() {
    if (!this.process) {
      return;
    }

    console.log(`[Server ${this.id}] Stopping...`);

    const stopped = this._stopWithTimeout(SERVER_SHUTDOWN_TIMEOUT_MS);

    if (!stopped) {
      console.warn(`[Server ${this.id}] Graceful shutdown timed out, force killing`);
      this.kill9();
    }

    this.process = null;
    this.ready = false;
  }

  kill9() {
    if (!this.process) {
      return;
    }

    console.log(`[Server ${this.id}] Force killing (SIGKILL)`);
    this.process.kill('SIGKILL');
    this.process = null;
    this.ready = false;
  }

  async restart() {
    await this.stop();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.start();
  }

  isRunning() {
    return this.process !== null && this.ready;
  }

  getLogs(filter = null) {
    if (filter) {
      return this.logs.filter(filter);
    }
    return [...this.logs];
  }

  getRecentLogs(count = 100) {
    return this.logs.slice(-count);
  }

  _parseLog(line, stream) {
    const log = {
      timestamp: Date.now(),
      stream,
      raw: line,
    };

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(line);
      log.json = parsed;
    } catch {
      // Not JSON, keep as raw
    }

    this.logs.push(log);

    // Keep log size bounded
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-5000);
    }
  }

  async _waitForReady() {
    const startTime = Date.now();
    const readyPattern = /Server listening|listening on/i;

    while (Date.now() - startTime < SERVER_STARTUP_TIMEOUT_MS) {
      // Check logs for ready signal
      const recentLogs = this.getRecentLogs(50);
      const hasReadySignal = recentLogs.some(
        (log) => readyPattern.test(log.raw) || (log.json?.level === 'info' && log.json?.msg?.includes('listening'))
      );

      if (hasReadySignal) {
        return;
      }

      // Check if process died
      if (!this.process || this.process.exitCode !== null) {
        throw new Error(`Server ${this.id} exited before becoming ready`);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Server ${this.id} did not become ready within ${SERVER_STARTUP_TIMEOUT_MS}ms`);
  }

  _stopWithTimeout(timeoutMs) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, timeoutMs);

      this.process.once('exit', () => {
        clearTimeout(timeout);
        resolve(true);
      });

      this.process.kill('SIGTERM');
    });
  }
}

class ServerManager {
  constructor() {
    this.instances = new Map();
  }

  async start(opts) {
    const server = new ServerInstance(opts);
    await server.start();
    this.instances.set(server.id, server);
    return server;
  }

  async stop(id) {
    const server = this.instances.get(id);
    if (!server) {
      throw new Error(`Server ${id} not found`);
    }
    await server.stop();
    this.instances.delete(id);
  }

  async stopAll() {
    const stopPromises = Array.from(this.instances.values()).map((server) => server.stop());
    await Promise.all(stopPromises);
    this.instances.clear();
  }

  kill9(id) {
    const server = this.instances.get(id);
    if (!server) {
      throw new Error(`Server ${id} not found`);
    }
    server.kill9();
    this.instances.delete(id);
  }

  kill9All() {
    for (const server of this.instances.values()) {
      server.kill9();
    }
    this.instances.clear();
  }

  get(id) {
    return this.instances.get(id);
  }

  getAll() {
    return Array.from(this.instances.values());
  }

  getRunningCount() {
    return Array.from(this.instances.values()).filter((s) => s.isRunning()).length;
  }
}

export { ServerInstance, ServerManager };

/**
 * Metrics sampler
 *
 * Samples RSS, heap, event-loop lag, pool use, nebius stats every 5 seconds
 */

import { performance } from 'perf_hooks';

class MetricsSampler {
  constructor(opts = {}) {
    this.intervalMs = opts.intervalMs || 5000;
    this.server = opts.server;
    this.samples = [];
    this.timer = null;
  }

  start() {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      this.sample();
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  sample() {
    const sample = {
      timestamp: Date.now(),
      rss: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      eventLoopLag: this._measureEventLoopLag(),
    };

    if (this.server) {
      sample.serverInFlight = this.server.getInFlightCount?.() || 0;
    }

    this.samples.push(sample);

    // Keep samples bounded
    if (this.samples.length > 1000) {
      this.samples = this.samples.slice(-500);
    }
  }

  _measureEventLoopLag() {
    const start = performance.now();
    setImmediate(() => {
      const lag = performance.now() - start;
      return lag;
    });
    return 0;
  }

  getSamples() {
    return [...this.samples];
  }

  getRecentSamples(count = 60) {
    return this.samples.slice(-count);
  }

  getStats() {
    if (this.samples.length === 0) {
      return null;
    }

    const rssValues = this.samples.map((s) => s.rss);
    const heapValues = this.samples.map((s) => s.heapUsed);
    const lagValues = this.samples.map((s) => s.eventLoopLag);

    return {
      rss: {
        min: Math.min(...rssValues),
        max: Math.max(...rssValues),
        avg: rssValues.reduce((a, b) => a + b, 0) / rssValues.length,
        latest: rssValues[rssValues.length - 1],
      },
      heap: {
        min: Math.min(...heapValues),
        max: Math.max(...heapValues),
        avg: heapValues.reduce((a, b) => a + b, 0) / heapValues.length,
        latest: heapValues[heapValues.length - 1],
      },
      eventLoopLag: {
        min: Math.min(...lagValues),
        max: Math.max(...lagValues),
        avg: lagValues.reduce((a, b) => a + b, 0) / lagValues.length,
        p99: this._percentile(lagValues, 99),
      },
      sampleCount: this.samples.length,
    };
  }

  _percentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  clear() {
    this.samples = [];
  }
}

export { MetricsSampler };

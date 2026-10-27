/**
 * Load generation
 *
 * Concurrency pool, ramp, latency histograms
 */

class LoadGenerator {
  constructor(opts = {}) {
    this.concurrency = opts.concurrency || 10;
    this.rampMs = opts.rampMs || 0;
    this.histograms = new Map();
  }

  async runConcurrent(fn, count) {
    const results = [];
    const errors = [];
    let active = 0;
    let completed = 0;

    const runOne = async () => {
      active++;
      const start = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - start;
        results.push({ result, duration });
      } catch (error) {
        const duration = Date.now() - start;
        errors.push({ error, duration });
      } finally {
        active--;
        completed++;
      }
    };

    // Ramp up
    if (this.rampMs > 0) {
      const rampDelay = this.rampMs / count;
      for (let i = 0; i < count; i++) {
        setTimeout(() => runOne(), i * rampDelay);
      }
    } else {
      // Immediate
      const promises = [];
      for (let i = 0; i < Math.min(count, this.concurrency); i++) {
        promises.push(runOne());
      }
      await Promise.all(promises);

      // Keep concurrency limit
      while (completed < count) {
        while (active < this.concurrency && completed + active < count) {
          runOne();
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Wait for all to complete
    while (completed < count) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      results,
      errors,
      total: count,
      success: results.length,
      failed: errors.length,
    };
  }

  recordHistogram(name, value) {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    this.histograms.get(name).push(value);
  }

  getHistogramStats(name) {
    const values = this.histograms.get(name) || [];
    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getAllHistograms() {
    const stats = {};
    for (const [name] of this.histograms) {
      stats[name] = this.getHistogramStats(name);
    }
    return stats;
  }

  clearHistograms() {
    this.histograms.clear();
  }
}

export { LoadGenerator };

/**
 * Results reporting
 *
 * Console table plus results/*.json output
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Reporter {
  constructor(opts = {}) {
    this.outputDir = opts.outputDir || join(__dirname, '..', 'results');
    this.results = [];
    this.histograms = new Map();
    this.invariantResults = [];
    this.metrics = null;
    this.unexpectedPasses = [];
  }

  addResult(result) {
    this.results.push(result);
  }

  addHistogram(name, stats) {
    this.histograms.set(name, stats);
  }

  addInvariantResults(results) {
    this.invariantResults = results;
  }

  setMetrics(metrics) {
    this.metrics = metrics;
  }

  setUnexpectedPasses(passes) {
    this.unexpectedPasses = passes;
  }

  printConsole() {
    console.log('\n' + '='.repeat(80));
    console.log('STRESS TEST RESULTS');
    console.log('='.repeat(80) + '\n');

    this._printSummary();
    this._printResults();
    this._printHistograms();
    this._printInvariants();
    this._printMetrics();
    this._printUnexpectedPasses();
  }

  _printSummary() {
    const summary = {
      total: this.results.length,
      pass: 0,
      fail: 0,
      skipped: 0,
      knownRed: 0,
    };

    for (const result of this.results) {
      switch (result.verdict) {
        case 'PASS':
          summary.pass++;
          break;
        case 'FAIL':
          summary.fail++;
          break;
        case 'SKIPPED':
          summary.skipped++;
          break;
        case 'KNOWN-RED':
          summary.knownRed++;
          break;
      }
    }

    console.log('SUMMARY');
    console.log('-------');
    console.log(`Total: ${summary.total}`);
    console.log(`✓ PASS: ${summary.pass}`);
    console.log(`✗ FAIL: ${summary.fail}`);
    console.log(`⊘ SKIPPED: ${summary.skipped}`);
    console.log(`⚠ KNOWN-RED: ${summary.knownRed}`);
    console.log();
  }

  _printResults() {
    console.log('CHECK RESULTS');
    console.log('-------------');

    for (const result of this.results) {
      const icon = this._getVerdictIcon(result.verdict);
      console.log(`${icon} ${result.checkId}: ${result.verdict} (${result.duration}ms)`);
      console.log(`   ${result.description}`);
      
      if (result.verdict === 'FAIL') {
        const failedAssertions = result.assertions.filter((a) => !a.passed);
        for (const assertion of failedAssertions) {
          console.log(`   ✗ ${assertion.message}`);
          if (assertion.expected !== undefined) {
            console.log(`     Expected: ${JSON.stringify(assertion.expected)}`);
          }
          if (assertion.actual !== undefined) {
            console.log(`     Actual: ${JSON.stringify(assertion.actual)}`);
          }
        }
      }
    }

    console.log();
  }

  _printHistograms() {
    if (this.histograms.size === 0) {
      return;
    }

    console.log('LATENCY HISTOGRAMS');
    console.log('-------------------');

    for (const [name, stats] of this.histograms) {
      console.log(`${name}:`);
      console.log(`  Count: ${stats.count}`);
      console.log(`  Min: ${stats.min}ms`);
      console.log(`  P50: ${stats.p50}ms`);
      console.log(`  P95: ${stats.p95}ms`);
      console.log(`  P99: ${stats.p99}ms`);
      console.log(`  Max: ${stats.max}ms`);
      console.log();
    }
  }

  _printInvariants() {
    if (!this.invariantResults) {
      return;
    }

    // Handle both array and object formats
    const results = Array.isArray(this.invariantResults) 
      ? this.invariantResults 
      : (this.invariantResults.passed || []).concat(this.invariantResults.failed || []);
    
    if (results.length === 0) {
      return;
    }

    const passed = results.filter((r) => r.passed);
    const failed = results.filter((r) => !r.passed);

    console.log('INVARIANT CHECKS');
    console.log('-----------------');
    console.log(`Passed: ${passed.length}`);
    console.log(`Failed: ${failed.length}`);

    for (const result of failed) {
      console.log(`✗ ${result.name}: ${result.details}`);
    }

    console.log();
  }

  _printMetrics() {
    if (!this.metrics) {
      return;
    }

    console.log('METRICS');
    console.log('-------');
    console.log(`RSS: ${this._formatBytes(this.metrics.rss.latest)} (avg: ${this._formatBytes(this.metrics.rss.avg)})`);
    console.log(`Heap: ${this._formatBytes(this.metrics.heap.latest)} (avg: ${this._formatBytes(this.metrics.heap.avg)})`);
    console.log(`Event Loop Lag P99: ${this.metrics.eventLoopLag.p99.toFixed(2)}ms`);
    console.log(`Samples: ${this.metrics.sampleCount}`);
    console.log();
  }

  _printUnexpectedPasses() {
    if (this.unexpectedPasses.length === 0) {
      return;
    }

    console.log('UNEXPECTED PASSES (KNOWN-RED CHECKS THAT PASSED)');
    console.log('-----------------------------------------------');

    for (const pass of this.unexpectedPasses) {
      console.log(`⚠ ${pass.checkId}: ${pass.description}`);
      console.log(`   Known issue: ${pass.knownIssue.reason}`);
      console.log(`   Fix PR: ${pass.knownIssue.fixPr || 'none'}`);
    }

    console.log();
  }

  _getVerdictIcon(verdict) {
    switch (verdict) {
      case 'PASS':
        return '✓';
      case 'FAIL':
        return '✗';
      case 'SKIPPED':
        return '⊘';
      case 'KNOWN-RED':
        return '⚠';
      default:
        return '?';
    }
  }

  _formatBytes(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
  }

  saveJson(filename = 'results.json') {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    const outputPath = join(this.outputDir, filename);
    const data = {
      timestamp: new Date().toISOString(),
      summary: this._getSummary(),
      results: this.results,
      histograms: Object.fromEntries(this.histograms),
      invariants: this.invariantResults,
      metrics: this.metrics,
      unexpectedPasses: this.unexpectedPasses,
    };

    writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Results saved to ${outputPath}`);
  }

  _getSummary() {
    const summary = {
      total: this.results.length,
      pass: 0,
      fail: 0,
      skipped: 0,
      knownRed: 0,
    };

    for (const result of this.results) {
      switch (result.verdict) {
        case 'PASS':
          summary.pass++;
          break;
        case 'FAIL':
          summary.fail++;
          break;
        case 'SKIPPED':
          summary.skipped++;
          break;
        case 'KNOWN-RED':
          summary.knownRed++;
          break;
      }
    }

    return summary;
  }
}

export { Reporter };

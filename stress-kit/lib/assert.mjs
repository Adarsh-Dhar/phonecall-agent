/**
 * Assertion model for stress testing
 *
 * Provides check(), expectRed(), skip(), require() methods
 * Tracks verdicts: PASS, FAIL, KNOWN-RED, SKIPPED
 */

class AssertionError extends Error {
  constructor(message, expected, actual) {
    super(message);
    this.name = 'AssertionError';
    this.expected = expected;
    this.actual = actual;
  }
}

class SkipError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SkipError';
  }
}

class AssertionContext {
  constructor(checkId, description) {
    this.checkId = checkId;
    this.description = description;
    this.assertions = [];
    this.verdict = null;
    this.duration = null;
    this.startTime = Date.now();
  }

  check(condition, message, expected = null, actual = null) {
    if (condition) {
      this.assertions.push({
        type: 'check',
        passed: true,
        message,
      });
    } else {
      this.assertions.push({
        type: 'check',
        passed: false,
        message,
        expected,
        actual,
      });
      throw new AssertionError(message, expected, actual);
    }
  }

  assertEquals(actual, expected, message) {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    this.check(passed, message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`, expected, actual);
  }

  assertNotEquals(actual, unexpected, message) {
    const passed = JSON.stringify(actual) !== JSON.stringify(unexpected);
    this.check(passed, message || `Expected not to equal ${JSON.stringify(unexpected)}`, unexpected, actual);
  }

  assertDeepEquals(actual, expected, message) {
    this.assertEquals(actual, expected, message);
  }

  assertGreaterThan(actual, expected, message) {
    const passed = actual > expected;
    this.check(passed, message || `Expected ${actual} > ${expected}`, expected, actual);
  }

  assertLessThan(actual, expected, message) {
    const passed = actual < expected;
    this.check(passed, message || `Expected ${actual} < ${expected}`, expected, actual);
  }

  assertGreaterThanOrEqual(actual, expected, message) {
    const passed = actual >= expected;
    this.check(passed, message || `Expected ${actual} >= ${expected}`, expected, actual);
  }

  assertLessThanOrEqual(actual, expected, message) {
    const passed = actual <= expected;
    this.check(passed, message || `Expected ${actual} <= ${expected}`, expected, actual);
  }

  assertContains(haystack, needle, message) {
    const passed = haystack.includes(needle);
    this.check(passed, message || `Expected ${haystack} to contain ${needle}`, needle, haystack);
  }

  assertNotContains(haystack, needle, message) {
    const passed = !haystack.includes(needle);
    this.check(passed, message || `Expected ${haystack} not to contain ${needle}`, needle, haystack);
  }

  assertThrows(fn, message) {
    let threw = false;
    try {
      fn();
    } catch (error) {
      threw = true;
    }
    this.check(threw, message || 'Expected function to throw');
  }

  assertDoesNotThrow(fn, message) {
    let threw = false;
    let error = null;
    try {
      fn();
    } catch (e) {
      threw = true;
      error = e;
    }
    this.check(!threw, message || `Expected function not to throw, but it threw: ${error?.message}`, null, error);
  }

  expectRed(checkId, reason, fixPr = null) {
    this.assertions.push({
      type: 'expect-red',
      checkId,
      reason,
      fixPr,
    });
  }

  skip(reason) {
    this.assertions.push({
      type: 'skip',
      reason,
    });
    throw new SkipError(reason);
  }

  require(condition, message) {
    if (!condition) {
      throw new AssertionError(message || 'Required condition failed');
    }
  }

  pass(message) {
    this.assertions.push({
      type: 'pass',
      message,
    });
  }

  fail(message) {
    this.assertions.push({
      type: 'fail',
      message,
    });
    throw new AssertionError(message);
  }

  complete(verdict = 'PASS') {
    this.duration = Date.now() - this.startTime;
    this.verdict = verdict;
    return {
      checkId: this.checkId,
      description: this.description,
      verdict: this.verdict,
      duration: this.duration,
      assertions: this.assertions,
    };
  }
}

class Ledger {
  constructor(knownIssuesPath) {
    this.knownIssuesPath = knownIssuesPath;
    this.knownIssues = new Map();
    this.loadKnownIssues();
  }

  loadKnownIssues() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.knownIssuesPath)) {
        const data = fs.readFileSync(this.knownIssuesPath, 'utf-8');
        const issues = JSON.parse(data);
        for (const issue of issues) {
          this.knownIssues.set(issue.checkId, issue);
        }
      }
    } catch (error) {
      console.warn(`Failed to load known issues: ${error.message}`);
    }
  }

  isKnownRed(checkId) {
    return this.knownIssues.has(checkId);
  }

  getKnownIssue(checkId) {
    return this.knownIssues.get(checkId);
  }

  markFixed(checkId) {
    const issue = this.knownIssues.get(checkId);
    if (issue) {
      this.knownIssues.delete(checkId);
      return issue;
    }
    return null;
  }
}

class TestRunner {
  constructor(ledger) {
    this.ledger = ledger;
    this.results = [];
    this.currentContext = null;
  }

  async runCheck(checkId, description, fn) {
    const context = new AssertionContext(checkId, description);
    this.currentContext = context;

    try {
      await fn(context);
      context.complete('PASS');
    } catch (error) {
      if (error instanceof SkipError) {
        context.complete('SKIPPED');
      } else if (error instanceof AssertionError) {
        // Check if this is a known red
        if (this.ledger && this.ledger.isKnownRed(checkId)) {
          context.complete('KNOWN-RED');
        } else {
          context.complete('FAIL');
        }
      } else {
        context.assertions.push({
          type: 'error',
          message: error.message,
          stack: error.stack,
        });
        context.complete('FAIL');
      }
    } finally {
      this.results.push(context.complete());
      this.currentContext = null;
    }

    return context;
  }

  getResults() {
    return [...this.results];
  }

  getSummary() {
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

  getExitCode() {
    const summary = this.getSummary();
    
    // Exit code 0: all pass or known-red only
    if (summary.fail === 0 && summary.skipped === 0) {
      return 0;
    }
    
    // Exit code 1: any failures
    if (summary.fail > 0) {
      return 1;
    }
    
    // Exit code 2: skipped tests (incomplete)
    if (summary.skipped > 0) {
      return 2;
    }
    
    return 0;
  }
}

export { AssertionError, SkipError, AssertionContext, Ledger, TestRunner };

// Helper function for scenarios to use directly
let globalTestRunner = null;

export function setTestRunner(runner) {
  globalTestRunner = runner;
}

export async function check(checkId, fn) {
  if (!globalTestRunner) {
    throw new Error('TestRunner not set. Call setTestRunner() first.');
  }
  
  const description = checkId; // Use checkId as description for now
  await globalTestRunner.runCheck(checkId, description, fn);
}

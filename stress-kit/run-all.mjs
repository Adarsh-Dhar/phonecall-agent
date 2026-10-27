/**
 * Stress Harness v2 Runner
 * 
 * Spawns everything, runs scenarios, prints verdicts, exit codes 0 / 1 / 2
 * Usage: node run-all.mjs [scenario_ids...] [--profile smoke|baseline|stress|soak|break]
 */

import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import harness libraries
import { getEnv } from './lib/env.mjs';
import { ServerManager } from './lib/server.mjs';
import { FakeNebiusServer } from './lib/fakeNebius.mjs';
import { ApiClient } from './lib/api.mjs';
import { AccountManager } from './lib/accounts.mjs';
import { FixtureBuilder } from './lib/fixtures.mjs';
import { TestRunner, Ledger, setTestRunner } from './lib/assert.mjs';
import { InvariantChecker } from './lib/invariants.mjs';
import { MetricsSampler } from './lib/sampler.mjs';
import { LoadGenerator } from './lib/loadgen.mjs';
import { Reporter } from './lib/report.mjs';

// Load profiles
const PROFILES = {
  smoke: {
    accounts: 5,
    instances: 1,
    nebiusDelay: 200,
    description: 'Smoke test - 5 accounts, 1 instance, fast Nebius',
  },
  baseline: {
    accounts: 20,
    instances: 1,
    nebiusDelay: 2000,
    description: 'Baseline - 20 accounts, realistic Nebius latency',
  },
  stress: {
    accounts: 100,
    instances: 2,
    nebiusDelay: 0,
    description: 'Stress - high load, 2 instances, Nebius with errors',
  },
  soak: {
    accounts: 20,
    instances: 1,
    nebiusDelay: 2000,
    duration: 3600000, // 60 minutes
    description: 'Soak - 60 min with random faults',
  },
  break: {
    accounts: 50,
    instances: 1,
    nebiusDelay: 0,
    testMode: false,
    description: 'Break - raise until errors, rate limiter active',
  },
};

// Scenario definitions
const SCENARIOS = [
  // Harness self-test
  { id: 'H0', file: 'scenarios/H0-harness-self-test.mjs', description: 'Harness Self-Test' },
  
  // Original plumbing tests (keep for compatibility)
  { id: '01', file: '01-contact-crud.mjs', description: 'Monday Morning Rush' },
  { id: '02', file: '02-contact-races.mjs', description: 'Double Tap' },
  { id: '03', file: '03-validation-fuzz.mjs', description: 'Validation Fuzz' },
  { id: '04', file: '04-dial-storm.mjs', description: 'Dial Storm' },
  { id: '05', file: '05-call-state-races.mjs', description: 'Call State Races' },
  { id: '06', file: '06-ws-soak.mjs', description: 'WebSocket Soak' },
  { id: '07', file: '07-authz-matrix.mjs', description: 'Authorization Matrix' },
  
  // Management agent (Nebius)
  { id: 'M1', file: 'scenarios/M1-garbled-reply.mjs', description: 'Garbled Reply' },
  { id: 'M2', file: 'scenarios/M2-slow-model.mjs', description: 'Slow Model' },
  { id: 'M3', file: 'scenarios/M3-liar-transcript.mjs', description: 'Liar Transcript' },
  { id: 'M4', file: 'scenarios/M4-double-extraction.mjs', description: 'Double Extraction' },
  { id: 'M5', file: 'scenarios/M5-memory-fades.mjs', description: 'Memory Fades' },
  { id: 'M6', file: 'scenarios/M6-alarm-clock.mjs', description: 'Alarm Clock' },
  { id: 'M7', file: 'scenarios/M7-unreachable-owner.mjs', description: 'Unreachable Owner' },
  
  // Nebius call sites without chapters
  { id: 'N1', file: 'scenarios/N1-call-analysis.mjs', description: 'Call Analysis' },
  { id: 'N2', file: 'scenarios/N2-call-quality.mjs', description: 'Call Quality' },
  { id: 'N3', file: 'scenarios/N3-conversations.mjs', description: 'Conversations' },
  { id: 'N4', file: 'scenarios/N4-orchestrator.mjs', description: 'Orchestrator' },
  
  // Phone agent (Gemini)
  { id: 'P1', file: 'scenarios/P1-silent-line.mjs', description: 'Silent Line' },
  { id: 'P2', file: 'scenarios/P2-hallucinated-hangup.mjs', description: 'Hallucinated Hang-up' },
  { id: 'P3', file: 'scenarios/P3-rulebook-enforcement.mjs', description: 'Rulebook Enforcement' },
  { id: 'P4', file: 'scenarios/P4-question-unanswered.mjs', description: 'Question Unanswered' },
  { id: 'P5', file: 'scenarios/P5-fast-talker.mjs', description: 'Fast Talker' },
  { id: 'P6', file: 'scenarios/P6-social-engineer.mjs', description: 'Social Engineer' },
  { id: 'P7', file: 'scenarios/P7-never-ending-call.mjs', description: 'Never-ending Call' },
  
  // End-to-end journeys
  { id: 'X1', file: 'scenarios/X1-mayas-monday.mjs', description: "Maya's Monday" },
  { id: 'X2', file: 'scenarios/X2-retry-storm.mjs', description: 'Retry Storm' },
  { id: 'X3', file: 'scenarios/X3-chaos-soak.mjs', description: 'Chaos Soak' },
];

class Harness {
  constructor(opts = {}) {
    this.env = getEnv();
    this.ledger = new Ledger(join(__dirname, 'known-issues.json'));
    this.testRunner = new TestRunner(this.ledger);
    this.reporter = new Reporter();
    this.serverManager = new ServerManager();
    this.fakeNebius = null;
    this.invariantChecker = new InvariantChecker(this.env.testDatabaseUrl);
    this.sampler = new MetricsSampler();
    this.accountManager = new AccountManager({
      jwtSecret: this.env.jwtSecret,
      baseUrl: this.env.baseUrl,
    });
    this.fixtureBuilder = new FixtureBuilder();
    this.loadGen = new LoadGenerator();
    
    this.profile = opts.profile || 'smoke';
    this.profileConfig = PROFILES[this.profile] || PROFILES.smoke;
    
    this.scenarioIds = opts.scenarioIds || SCENARIOS.map(s => s.id);
  }

  async setup() {
    console.log(`Setting up harness (profile: ${this.profile})...`);
    console.log(`  ${this.profileConfig.description}`);
    
    // Start fake Nebius
    this.fakeNebius = new FakeNebiusServer({
      port: 9453,
      delayMs: this.profileConfig.nebiusDelay,
    });
    await this.fakeNebius.start();
    console.log(`  ✓ Fake Nebius on port 9453`);
    
    // Start server instances
    for (let i = 0; i < this.profileConfig.instances; i++) {
      const port = 5175 + i;
      const server = await this.serverManager.start({
        id: `server-${i}`,
        port,
        dbUrl: this.env.testDatabaseUrl,
        jwtSecret: this.env.jwtSecret,
        testMode: this.profileConfig.testMode !== false,
      });
      console.log(`  ✓ Server instance ${i} on port ${port}`);
    }
    
    // Start metrics sampler
    this.sampler.server = this.fakeNebius;
    this.sampler.start();
    console.log(`  ✓ Metrics sampler started`);
    
    // Seed accounts
    const accounts = await this.accountManager.seedAccounts(this.profileConfig.accounts);
    console.log(`  ✓ Seeded ${accounts.length} accounts`);
  }

  async runScenario(scenarioId) {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioId}`);
    }
    
    console.log(`\nRunning scenario ${scenarioId}: ${scenario.description}`);
    
    // Check if scenario file exists
    const scenarioPath = join(__dirname, scenario.file);
    if (!existsSync(scenarioPath)) {
      // Scenario not implemented yet - skip
      console.log(`  ⊘ SKIPPED (not implemented)`);
      this.testRunner.results.push({
        checkId: scenarioId,
        description: scenario.description,
        verdict: 'SKIPPED',
        duration: 0,
        assertions: [{ type: 'skip', reason: 'Scenario not implemented' }],
      });
      return;
    }

    // Set global test runner for check() function
    setTestRunner(this.testRunner);

    // Import and run scenario
    const scenarioModule = await import(scenarioPath);
    const context = {
      env: this.env,
      api: new ApiClient({
        baseUrl: this.env.baseUrl,
        jwt: await this.accountManager.mintJwt(this.accountManager.getAllAccounts()[0].id),
      }),
      accountManager: this.accountManager,
      accounts: this.accountManager,
      fixtures: this.fixtureBuilder,
      server: this.serverManager.get('server-0'),
      fakeNebius: this.fakeNebius,
      loadGen: this.loadGen,
      testRunner: this.testRunner,
    };
    
    await scenarioModule.default(context);
    
    // Run invariants after scenario
    console.log(`  Running invariants...`);
    const invariantResults = await this.invariantChecker.checkAll();
    this.reporter.addInvariantResults(invariantResults);
    
    const failedInvariants = invariantResults.passed ? [] : invariantResults.failed || [];
    if (failedInvariants.length > 0) {
      console.log(`  ✗ ${failedInvariants.length} invariant(s) failed`);
      for (const inv of failedInvariants) {
        console.log(`    - ${inv.name}: ${inv.details}`);
      }
    } else {
      console.log(`  ✓ All invariants passed`);
    }
  }

  async run() {
    await this.setup();
    
    for (const scenarioId of this.scenarioIds) {
      try {
        await this.runScenario(scenarioId);
      } catch (error) {
        console.error(`  ✗ Scenario ${scenarioId} failed: ${error.message}`);
        this.testRunner.results.push({
          checkId: scenarioId,
          description: SCENARIOS.find(s => s.id === scenarioId)?.description || scenarioId,
          verdict: 'FAIL',
          duration: 0,
          assertions: [{ type: 'error', message: error.message }],
        });
      }
    }
    
    await this.teardown();
  }

  async teardown() {
    console.log(`\nTearing down harness...`);
    
    this.sampler.stop();
    this.reporter.setMetrics(this.sampler.getStats());
    
    await this.serverManager.stopAll();
    await this.fakeNebius.stop();
    await this.invariantChecker.close();
    
    console.log(`  ✓ Tear down complete`);
  }

  report() {
    this.reporter.results = this.testRunner.getResults();
    
    // Check for unexpected passes
    const unexpectedPasses = [];
    for (const result of this.reporter.results) {
      if (result.verdict === 'PASS' && this.ledger.isKnownRed(result.checkId)) {
        const issue = this.ledger.getKnownIssue(result.checkId);
        unexpectedPasses.push({
          checkId: result.checkId,
          description: result.description,
          knownIssue: issue,
        });
      }
    }
    this.reporter.setUnexpectedPasses(unexpectedPasses);
    
    this.reporter.printConsole();
    this.reporter.saveJson();
    
    return this.testRunner.getExitCode();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const scenarioIds = [];
  let profile = 'smoke';
  
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--profile=')) {
      profile = arg.split('=')[1];
      i++;
    } else if (arg === '--profile') {
      // Next arg is the profile value
      if (i + 1 < args.length) {
        profile = args[i + 1];
        i += 2;
      } else {
        i++;
      }
    } else if (!arg.startsWith('--')) {
      scenarioIds.push(arg);
      i++;
    } else {
      i++;
    }
  }
  
  // Filter to only valid scenario IDs
  const validIds = SCENARIOS.map(s => s.id);
  const filteredIds = scenarioIds.filter(id => validIds.includes(id));
  
  if (filteredIds.length !== scenarioIds.length) {
    const invalid = scenarioIds.filter(id => !validIds.includes(id));
    console.error(`Invalid scenario IDs: ${invalid.join(', ')}`);
    console.error(`Valid IDs: ${validIds.join(', ')}`);
    process.exit(1);
  }
  
  const harness = new Harness({
    scenarioIds: scenarioIds.length > 0 ? scenarioIds : null,
    profile,
  });
  
  try {
    await harness.run();
    const exitCode = harness.report();
    process.exit(exitCode);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

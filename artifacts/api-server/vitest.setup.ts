// Runs before every test file, before any module imports Prisma.
import dotenv from 'dotenv';
dotenv.config();

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Example: postgresql://phoneagent:phoneagent_password@localhost:5435/phone_agent_test',
  );
}

const dbName = new URL(testUrl).pathname.replace(/^\//, '');
if (!/_test$/.test(dbName)) {
  throw new Error(`Refusing to run tests: database name "${dbName}" must end in "_test".`);
}

// Prisma reads DATABASE_URL, so point it at the test DB (overrides any dev value in the shell).
process.env.DATABASE_URL = testUrl;

// Clear task-related environment variables to prevent test leakage
delete process.env.TASK_CONFIDENCE_THRESHOLD;
delete process.env.TASK_ACTION_CONFIDENCE_THRESHOLD;
delete process.env.KNOWLEDGE_CONFIDENCE_THRESHOLD;

// Clear scheduler-related environment variables to prevent test leakage
delete process.env.SCHEDULER_STALE_HOURS;
delete process.env.SCHEDULER_MAX_ATTEMPTS;
delete process.env.SCHEDULER_CLAIM_TTL_MS;
delete process.env.CALL_SCHEDULER_POLL_MS;

// Runs before every test file, before any module imports Prisma.
// One guard for all tests: only a database whose NAME ends in "_test" is allowed.
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

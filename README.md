# phonecall-agent

## Running Tests

Tests run against a real PostgreSQL database. All commands from the **repo root** unless noted.

1. Start the test database: `docker-compose up -d postgres-test`
2. Point at it (the name must end in `_test`):
   `export TEST_DATABASE_URL="postgresql://phoneagent:phoneagent_password@localhost:5435/phone_agent_test"`
3. Apply migrations to the test DB (the `prisma/` folder is at the repo root):
   `DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy`
4. Check that the new schema landed:
   `docker exec phone-agent-postgres-test psql -U phoneagent -d phone_agent_test -c '\d "PushSubscription"' -c '\d "Call"'`
   (Call must show outcome, outcomeSummary, confirmedAt, confirmationRef, taskId.)
5. Run: `pnpm --filter @workspace/api-server test` and `pnpm typecheck`

`vitest.setup.ts` refuses to run unless `TEST_DATABASE_URL` is set and its database name ends in `_test`,
and it overrides `DATABASE_URL` with it, so tests can never touch your dev or prod database.

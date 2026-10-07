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

## Environment Variables

### Scheduler Configuration

- `SCHEDULER_STALE_HOURS` (default: 24) - Hours after which a task is considered stale and won't be triggered
- `SCHEDULER_MAX_ATTEMPTS` (default: 3) - Maximum number of retry attempts for a task notification
- `SCHEDULER_CLAIM_TTL_MS` (default: 300000) - Time in milliseconds after which a stuck claim is released (5 minutes)
- `CALL_SCHEDULER_POLL_MS` (default: 30000) - Poll interval in milliseconds for the call scheduler (30 seconds)
- `AUTODIAL_ENABLED` (default: false) - Enable real auto-dial via telephony provider (requires provider setup)

### Timezone Settings

- `DEFAULT_TIMEZONE` (default: Asia/Kolkata) - Default timezone for date/time resolution when user timezone is not set

# Phonecall-Agent Stress Testing Kit

A comprehensive stress testing suite for the phonecall-agent application, designed to find race conditions, concurrency issues, and performance bottlenecks under load.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- pnpm

## Quick Start

### 1. Start Test Database

```bash
docker-compose up -d postgres-test
```

### 2. Configure Environment

Copy the example environment file:
```bash
cd stress-kit
cp .env.example .env
```

Edit `.env` and set:
- `JWT_SECRET` to match your server's JWT_SECRET
- `TEST_DATABASE_URL` to point to the test database

### 3. Migrate Test Database

```bash
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
```

### 4. Start API Server with Test Configuration

```bash
cd artifacts/api-server
DATABASE_URL="$TEST_DATABASE_URL" \
JWT_SECRET="your-secret" \
NODE_ENV=development \
PORT=5175 \
CALL_SCHEDULER_AUTO_DIAL=0 \
CALL_SCHEDULER_POLL_MS=1000 \
RINGING_TIMEOUT_MS=2000 \
GEMINI_API_KEY=fake \
pnpm run dev
```

### 5. Install Stress Kit Dependencies

```bash
cd stress-kit
npm install
```

### 6. Seed Test Accounts

```bash
npm run seed
```

This creates:
- Individual accounts: `individual0@stress-test.local` through `individualN@stress-test.local`
- Business accounts: `business0@stress-test.local` through `businessN@stress-test.local`
- JWT tokens saved to `tokens.json`

### 7. Run Tests

Run all chapters:
```bash
npm test
```

Run a specific chapter:
```bash
npm run test:chapter 1
```

### 8. Cleanup

Remove test accounts:
```bash
npm run cleanup
```

## Test Chapters

### Chapter 1: Monday Morning Rush ✓
Tests concurrent contact CRUD operations (search, add, create, update, delete, list).

### Chapter 2: Double Tap ✓
Tests race conditions from rapid retries and concurrent operations.
- Expected failures: duplicate contacts from parallel adds, edit-vs-delete 500 errors

### Chapter 3: Validation Fuzz ✓
Tests input validation with malformed data (null bytes, large payloads, wrong types).

### Chapter 4: Dial Storm ✓
Tests concurrent call placement and callback task deduplication.
- Expected failures: multiple ringing calls, duplicate callback tasks

### Chapter 5: Call State Races ✓
Tests accept/decline/timeout state transitions under concurrency.
- Expected failures: accept and decline both succeed, accepted call overwritten to missed

### Chapter 6: WebSocket Soak ✓
Tests long-running WebSocket connections, reconnects, and malformed frames.

### Chapter 7: Authorization Matrix ✓
Tests tenant isolation and authorization boundaries.
- Expected finding: Knowledge routes may share across users who saved same business

## Configuration

Environment variables (in `.env`):

- `API_BASE`: API server URL (default: `http://localhost:5175/api`)
- `JWT_SECRET`: Secret key for JWT token generation
- `N_INDIVIDUALS`: Number of test individual accounts (default: 20)
- `CONCURRENCY`: Number of concurrent operations (default: 20)
- `ITERATIONS`: Number of iterations for repeatable tests (default: 200)
- `TEST_DATABASE_URL`: PostgreSQL connection string (must end with `_test`)

## Safety Features

- **Database Protection**: Refuses to run unless database name ends with `_test`
- **Localhost Only**: Refuses to run unless database is on localhost
- **Isolated Accounts**: Uses dedicated `@stress-test.local` email domain
- **No Real Messages**: Leaves messaging variables unset to prevent real sends

## Monitoring During Tests

Watch these metrics during test runs:

### Database Connections
```sql
SELECT count(*) FROM pg_stat_activity;
```

### Stuck Ringing Calls
```sql
SELECT count(*) FROM "Call" 
WHERE status='ringing' 
AND "ringingAt" < now() - interval '2 minutes';
```

### Stuck Online Users
```sql
SELECT count(*) FROM "Account" 
WHERE "lastSeenAt" < now() - interval '1 minute'
AND online = true;
```

### Server Resources
- RSS memory usage
- Event loop lag
- Postgres connection pool usage

## Ramp Plan

1. **Smoke**: 5 users, concurrency 5 - Verify wiring works
2. **Baseline**: 20 users, concurrency 20 - Record reference metrics
3. **Stress**: 100 users, concurrency 100 - Find performance knee
4. **Soak**: 20 users, 1 hour - Check for memory/connection leaks
5. **Break**: Increase until errors appear - Learn failure modes

## Exit Criteria

The contact and calling paths are ready when:
- Every chapter passes at Stress stage with no 5xx errors
- Findings 1-5 from code review are fixed
- Soak stage ends with flat memory and connections
- Break stage fails politely (429/503) without crash

## Known Issues (from Code Review)

1. ✓ **FIXED**: Duplicate `const` declaration in callScheduler.ts
2. **HIGH**: Accept/decline are check-then-write, not atomic
3. **HIGH**: No unique index on contact link, duplicates possible under retries
4. **MEDIUM**: Concurrent dials leave multiple ringing calls
5. **MEDIUM**: Knowledge routes accept shared business ID (cross-user access)
6. **MEDIUM**: WebSocket has no maxPayload, no rate limit, no heartbeat
7. **MEDIUM**: No HTTP rate limiting and no field length validation

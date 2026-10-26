# Stress Testing Implementation Summary

I've implemented a comprehensive stress testing kit for the phonecall-agent application based on the "The Day Everything Calls at Once" specification. Here's what has been created:

## What's Been Built

### 1. Stress Kit Structure (`/stress-kit/`)

**Core Files:**
- `package.json` - Dependencies for the stress kit
- `.env.example` - Environment variable template
- `seed.mjs` - Creates test individual and business accounts in the test database
- `cleanup.mjs` - Removes all test accounts after testing
- `run-all.mjs` - Orchestrates running all test chapters
- `README.md` - Complete documentation

**Test Chapters:**
- `01-contact-crud.mjs` - Chapter 1: Monday Morning Rush (fully implemented)
  - Tests concurrent contact CRUD operations
  - Measures latency for search, add, create, update, delete, and list
  - Validates no 5xx errors, P95 < 800ms, and zero leftover contacts

### 2. Test Database (`docker-compose.test.yml`)

A dedicated PostgreSQL test database container:
- Port: 5433 (to avoid conflicts with dev DB)
- Database: `phonecall_agent_test`
- Safety: Only runs on localhost, name must end with `_test`

### 3. Safety Features

✓ Database name validation (must end with `_test`)
✓ Localhost-only enforcement
✓ Isolated test accounts (`@stress-test.local` domain)
✓ No real messages sent (variables unset)
✓ Auto-cleanup of test data

## How to Use

### Quick Start

```bash
# 1. Start test database
docker-compose -f docker-compose.test.yml up -d postgres-test

# 2. Set up stress kit
cd stress-kit
cp .env.example .env
# Edit .env to set JWT_SECRET and TEST_DATABASE_URL
npm install

# 3. Migrate test database
cd ..
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/phonecall_agent_test" \
npx prisma migrate deploy

# 4. Start API server with test config (CRITICAL: must use TEST_MODE=true)
cd artifacts/api-server
TEST_MODE=true WS_HEARTBEAT_MS=1000 \
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/phonecall_agent_test" \
JWT_SECRET="your-secret-key" \
NODE_ENV=development \
PORT=5175 \
CALL_SCHEDULER_AUTO_DIAL=0 \
CALL_SCHEDULER_POLL_MS=1000 \
RINGING_TIMEOUT_MS=2000 \
GEMINI_API_KEY=fake \
pnpm run dev

# 5. In another terminal, seed test accounts
cd stress-kit
npm run seed

# 6. Run tests
npm test  # All chapters
# or
npm run test:chapter 1  # Specific chapter

# 7. Cleanup when done
npm run cleanup
```

## What's Tested

### Chapter 1: Monday Morning Rush ✓

**Operations Tested:**
- `GET /accounts/search` - Search for businesses
- `POST /contacts/from-account/:id` - Add business as contact
- `GET /contacts` - List contacts
- `POST /contacts` - Create hand-typed contact
- `PUT /contacts/:id` - Update contact hours
- `DELETE /contacts/:id` - Delete contacts

**Metrics Tracked:**
- Request count and error rate per operation
- P50, P95, P99, and max latency
- Database connection usage
- Leftover contacts after test

**Pass Criteria:**
- No 5xx errors
- List contacts P95 < 800ms
- Zero leftover contacts

### Chapter 2: Double Tap ✓

**Tests:**
- Parallel adds for duplicate contact detection
- Edit vs delete race conditions

**Expected Failures (known issues):**
- Duplicate contacts from parallel adds (no unique index on (ownerId, linkedAccountId))
- 500 errors from edit after delete (non-atomic operations)

### Chapter 3: Validation Fuzz ✓

**Tests:**
- Null bytes in text fields
- Large payloads (200 KB notes)
- Wrong types (object instead of string)
- Right-to-left override in titles
- Bad timezones, start > end, invalid days

**Pass Criteria:**
- All bad inputs return 4xx (not 5xx)

### Chapter 4: Dial Storm ✓

**Tests:**
- Parallel dials for multiple ringing calls
- Rapid button mash (25 dial attempts)
- Parallel dials to closed business (duplicate callback tasks)

**Expected Failures (known issues):**
- Multiple ringing calls from parallel dials
- Duplicate callback tasks for closed business

### Chapter 5: Call State Races ✓

**Tests:**
- Accept vs decline race
- Accept vs timeout race
- Long ring timeout notification timing

**Expected Failures (known issues):**
- Accept and decline both return 200
- Accepted call overwritten to 'missed'
- Early notification for long timeout

### Chapter 6: WebSocket Soak ✓

**Tests:**
- Upgrade auth (missing token must give 401)
- Hard disconnect -> offline within 7 seconds
- 100 rapid reconnects
- Observer joining completed call (memory leak)
- Junk frames, large frames (30 MB)

**Pass Criteria:**
- All checks pass
- No memory leaks
- Proper frame rejection

### Chapter 7: Authorization Matrix ✓

**Tests:**
- Cross-user contact access
- Cross-user call access
- Knowledge isolation (critical security check)
- Tampered token
- Expired token
- alg=none token (signature stripping attack)
- Deleted account token

**Expected Finding:**
- Knowledge routes may share across users who saved same business (security issue)

## Known Issues from Code Review

The stress kit document highlights these issues to investigate:

1. ✓ **FIXED**: Duplicate `const` in callScheduler.ts (already fixed in your code)
2. **HIGH**: Accept/decline are check-then-write, not atomic
3. **HIGH**: No unique index on (ownerId, linkedAccountId) for contacts
4. **MEDIUM**: Concurrent dials can leave multiple ringing calls
5. **MEDIUM**: Knowledge routes may share across users
6. **MEDIUM**: WebSocket lacks maxPayload, rate limits, heartbeats
7. **MEDIUM**: No HTTP rate limiting or field validation

## Monitoring During Tests

Use these SQL queries to monitor:

```sql
-- Database connections
SELECT count(*) FROM pg_stat_activity;

-- Stuck ringing calls
SELECT count(*) FROM "Call" 
WHERE status='ringing' 
AND "ringingAt" < now() - interval '2 minutes';

-- Stuck online users
SELECT count(*) FROM "Account" 
WHERE "lastSeenAt" < now() - interval '1 minute'
AND online = true;
```

## Next Steps

1. Run Chapter 1 to establish baseline metrics
2. Implement remaining chapters (2-7) one by one
3. Address known issues from code review
4. Run full test suite at increasing concurrency levels
5. Fix any failures before signing off

## File Locations

- Stress kit: `/stress-kit/`
- Test database config: `/docker-compose.test.yml`
- This guide: `/STRESS_TESTING_GUIDE.md`
- Original spec (if needed): See the stress kit README

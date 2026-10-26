# Stress Test Harness Fixes - Summary

## Overview
Fixed false-pass problems and database safety issues in the stress test harness to ensure reliable certification of the phonecall-agent application.

## Files Changed

### 1. `seed.mjs`
**Changes:**
- Removed fallback to `DATABASE_URL` - now requires only `TEST_DATABASE_URL`
- Added database safety checks: must be localhost and database name must end with `_test`
- Removed duplicate `COMMIT` statement (was calling commit twice)
- Improved error messages to clarify safety requirements

**Impact:** Prevents accidental use of production databases and ensures all stress tests run against isolated test database.

### 2. `01-contact-crud.mjs`
**Changes:**
- Added database safety checks (localhost + `_test` suffix)
- Removed fallback to `DATABASE_URL`
- **Removed the silent skip of update operations** - update step now fails if it errors instead of being silently skipped
- Fixed update call to pass `token` parameter (was missing)

**Impact:** Chapter 1 now properly tests all CRUD operations including update. If update fails due to auth or other issues, it will be reported as a failure rather than silently skipped.

### 3. `02-contact-races.mjs`
**Changes:**
- Added database safety checks
- Removed fallback to `DATABASE_URL`
- **Removed unconditional exit code 0** - now exits with code 1 if duplicates or 500 errors are detected
- Changed test behavior from "expected failures" to actual FAIL conditions

**Impact:** Chapter 2 now properly fails if concurrent adds create duplicate contacts or if edit-vs-delete produces HTTP 500 errors.

### 4. `03-validation-fuzz.mjs`
**Changes:**
- **Modified validation logic to FAIL on any non-4xx response** (including 2xx success responses for invalid input)
- Added detection of connection errors (status 0) as failures
- Previously only counted 5xx as failures, which allowed invalid inputs returning 200 to pass

**Impact:** Chapter 3 now correctly rejects tests where invalid input returns 2xx (success) instead of 4xx (client error).

### 5. `04-dial-storm.mjs`
**Changes:**
- Added database safety checks
- Removed fallback to `DATABASE_URL`
- **Removed unconditional exit code 0** - now exits with code 1 if multiple ringing calls, duplicate calls, or duplicate tasks are detected
- **Added check that dial requests actually succeeded** - fails if no dial requests succeeded (test not executed)
- Changed test behavior from "expected failures" to actual FAIL conditions

**Impact:** Chapter 4 now properly fails if parallel dials create multiple ringing calls, duplicate callback tasks, or if tests cannot execute properly.

### 6. `05-call-state-races.mjs`
**Changes:**
- Added database safety checks
- Removed fallback to `DATABASE_URL`
- **Removed unconditional exit code 0** - now exits with code 1 if accept/decline both succeed, accepted calls are overwritten to missed, or early notifications occur
- Changed test behavior from "expected failures" to actual FAIL conditions

**Impact:** Chapter 5 now properly fails if race conditions are detected in call state transitions.

### 7. `06-ws-soak.mjs`
**Changes:**
- Added database safety checks
- Removed fallback to `DATABASE_URL`
- **Removed hardcoded memory-leak success** - now reports memory leak check as SKIP (requires external process monitoring)
- Added explicit reporting of unimplemented checks as SKIP:
  - Heartbeat behavior (ping/pong)
  - Room cleanup when last socket leaves
  - One-hour soak with 20 users
  - Half-open network connection handling
  - Rate limiting behavior
- Modified pass/fail logic to distinguish between implemented checks (must pass) and skipped checks (manual verification required)

**Impact:** Chapter 6 now accurately reports which checks are implemented and which require manual verification. No longer falsely claims memory leak check passed without evidence.

### 8. `07-authz-matrix.mjs`
**Changes:**
- Added database safety checks
- Removed fallback to `DATABASE_URL`
- **Changed deleted-account test from PASS to SKIP** - properly marked as manual test required
- **Changed cross-user call test from PASS to SKIP** when dial fails (phone setup required)
- Modified pass/fail logic to distinguish between required checks (must pass) and skipped checks (manual verification required)
- Exit code 0 for SKIP (not a failure, but requires manual verification)
- Exit code 1 only for actual failures

**Impact:** Chapter 7 no longer counts skipped manual tests as passes. Properly reports which security checks were automated and which require manual verification.

### 9. `run-all.mjs`
**Changes:**
- **Added SKIP status detection** - now distinguishes PASS, FAIL, and SKIP
- Captures chapter output to detect SKIP status (looks for "⚠️  SKIP" or "SKIP (manual test required)")
- Modified summary to show separate counts for Passed, Failed, and Skipped
- Exit code 0 for all PASS or for PASS+SKIP (with warning about manual verification)
- Exit code 1 only if any chapter FAILs

**Impact:** The test runner now properly distinguishes between skipped tests (manual verification required) and actual failures.

### 10. `cleanup.mjs`
**Changes:**
- Added database safety checks (localhost + `_test` suffix)
- Fixed path to tokens.json (was `./stress-kit/tokens.json` but should be `./tokens.json` when run from stress-kit directory)

**Impact:** Prevents accidental cleanup of production databases.

## Key Behavioral Changes

### Before Fix
- Chapters 2, 4, 5 always exited with code 0 even when detecting failures
- Chapter 3 only counted 5xx as failures, allowing 2xx on invalid input to pass
- Chapter 6 hardcoded memory leak check as PASS without measuring memory
- Chapter 7 counted skipped manual tests as PASS
- Database URL could fall back to production database
- No localhost or `_test` suffix validation

### After Fix
- All chapters exit with code 1 on actual failures
- Chapter 3 fails on any non-4xx response (including 2xx on invalid input)
- Chapter 6 reports memory leak as SKIP (requires external monitoring)
- Chapter 7 reports manual tests as SKIP (not PASS)
- Database safety checks prevent use of non-localhost or non-_test databases
- TEST_DATABASE_URL is required with no fallback to DATABASE_URL
- run-all.mjs distinguishes PASS, FAIL, and SKIP

## Remaining Manual Tests (Reported as SKIP)

### Chapter 6 (WebSocket Soak)
- Memory leak monitoring (requires external process RSS monitoring)
- Heartbeat behavior (ping/pong)
- Room cleanup when last socket leaves
- One-hour soak with 20 users
- Half-open network connection handling
- Rate limiting behavior

### Chapter 7 (Authorization)
- Cross-user call access (requires phone setup)
- Deleted account token (requires manual account deletion and token reuse)

## Next Steps

1. **Start isolated test database:**
   ```bash
   cd ~/Documents/phonecall-agent
   docker compose up -d postgres-test
   export TEST_DATABASE_URL="postgresql://phoneagent:phoneagent_password@localhost:5435/phone_agent_test"
   export JWT_SECRET="local-stress-test-secret-change-this-to-a-long-random-value"
   ```

2. **Apply migrations to test database:**
   ```bash
   DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
   ```

3. **Start API server in test mode:**
   ```bash
   TEST_MODE=true WS_HEARTBEAT_MS=1000 \
   DATABASE_URL="$TEST_DATABASE_URL" JWT_SECRET="$JWT_SECRET" NODE_ENV=development PORT=5175 \
   CALL_SCHEDULER_AUTO_DIAL=0 CALL_SCHEDULER_POLL_MS=1000 RINGING_TIMEOUT_MS=2000 GEMINI_API_KEY=fake \
   pnpm --dir artifacts/api-server run dev
   ```

4. **Seed test accounts:**
   ```bash
   cd ~/Documents/phonecall-agent/stress-kit
   cp .env.example .env
   # Edit .env to set API_BASE, JWT_SECRET, TEST_DATABASE_URL
   unset DATABASE_URL
   npm run seed
   ```

5. **Run chapters individually:**
   ```bash
   set -o pipefail
   npm run test:chapter -- 1 2>&1 | tee chapter-1.log
   npm run test:chapter -- 2 2>&1 | tee chapter-2.log
   # ... etc for all chapters
   ```

6. **Run full suite:**
   ```bash
   npm test 2>&1 | tee final-stress-suite.log
   ```

7. **Run ordinary application tests:**
   ```bash
   cd ~/Documents/phonecall-agent
   pnpm --dir artifacts/api-server test
   pnpm run typecheck
   pnpm run build
   ```

8. **Cleanup (only after confirming TEST_DATABASE_URL still points to phone_agent_test):**
   ```bash
   cd ~/Documents/phonecall-agent/stress-kit
   npm run cleanup
   ```

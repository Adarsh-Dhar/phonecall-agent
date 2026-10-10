# phonecall-agent

## Individuals and businesses

The app supports two account roles with separate frontends and API surfaces:

| Role | Account type | Frontend | API access | AI behavior |
|------|-------------|----------|------------|-------------|
| Individual | `isService: false` | Full app (Calls, Contacts, History, Calendar, Tasks) | All endpoints except `/api/business/*` | AI represents the individual and speaks for them in both call directions |
| Business | `isService: true` | Calls + Contacts only | `/api/business/*` endpoints only | No AI — the business human speaks directly to the individual's AI agent |

### Hard limitations

- Calls are strictly individual ↔ business; same-role calls are rejected.
- Individuals can only add/search business contacts (no fallback across account types).
- Businesses can only add/search individual contacts.
- Individuals cannot access `/api/business/*` (403 Forbidden).
- Businesses cannot access individual-only APIs (403 Forbidden).
- Browser test calls are blocked for business accounts.
- The AI agent always represents the individual, never the business.
- On calls, the individual observes the transcript without speaking; the business human speaks to the individual's AI agent.

### Call party resolution

The `Call` model includes `individualId`, `businessId`, and `initiatedBy` fields to track call parties and direction. Existing calls are backfilled by migration where possible; calls with unresolved parties remain nullable and are rejected by the voice socket.

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

## Settings

### Scheduler Configuration

- `SCHEDULER_STALE_HOURS` (default: 24) - Hours after which a task is considered stale and won't be triggered
- `SCHEDULER_MAX_ATTEMPTS` (default: 3) - Maximum number of retry attempts for a task notification
- `SCHEDULER_CLAIM_TTL_MS` (default: 300000) - Time in milliseconds after which a stuck claim is released (5 minutes)
- `CALL_SCHEDULER_POLL_MS` (default: 30000) - Poll interval in milliseconds for the call scheduler (30 seconds)
- `AUTODIAL_ENABLED` (default: false) - Enable real auto-dial via telephony provider (requires provider setup)

### Timezone Settings

- `DEFAULT_TIMEZONE` (default: Asia/Kolkata) - Default timezone for date/time resolution when user timezone is not set

### Business Hours

Business hours can be set on contacts to control when the scheduler attempts to call them. The format is a JSON object with the following structure:

```json
{
  "days": [1, 2, 3, 4, 5],
  "start": 9,
  "end": 17,
  "tz": "Asia/Kolkata"
}
```

- `days`: Array of day numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
- `start`: Start hour in 24-hour format (0-23)
- `end`: End hour in 24-hour format (0-24, exclusive)
- `tz`: Timezone string (optional, defaults to contact's timezone or DEFAULT_TIMEZONE)

Example: `{"days":[1,2,3,4,5],"start":9,"end":17,"tz":"Asia/Kolkata"}` means Monday through Friday, 9 AM to 5 PM IST.

## Environment Variables

### API Keys

- `GEMINI_API_KEY` - Google Gemini API key for voice processing
- `GEMINI_LIVE_MODEL` - Model to use for live voice calls
- `NEBIUS_API_KEY` - Nebius API key for all orchestrator text calls (task/knowledge extraction, post-call escalation, topic classification/summaries, demo chat)
- `NEBIUS_BASE_URL` - Nebius API base URL
- `NEBIUS_MODEL` - Nebius model to use
- `NEBIUS_FALLBACK_MODEL` - (optional) model used when `NEBIUS_MODEL` is rejected; defaults to `Qwen/Qwen3.5-397B-A17B`
- `LOG_LLM_RAW` - (optional) set to `1` to log a truncated preview of an unparseable extraction response at debug level; off by default because it is derived from call transcripts

### Google Calendar

- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - Google OAuth redirect URI
- `GOOGLE_CALENDAR_ID` - Google Calendar ID to sync tasks to

### Push Notifications

- `VAPID_PUBLIC_KEY` - VAPID public key for web push
- `VAPID_PRIVATE_KEY` - VAPID private key for web push
- `VAPID_SUBJECT` - VAPID subject (contact email)

### Exotel Telephony (Optional)

- `EXOTEL_SID` - Exotel SID
- `EXOTEL_API_KEY` - Exotel API key
- `EXOTEL_API_TOKEN` - Exotel API token
- `EXOTEL_SUBDOMAIN` - Exotel subdomain
- `EXOTEL_CALLER_ID` - Exotel caller ID
- `EXOTEL_APP_ID` - Exotel app ID
- `EXOTEL_PASSTHRU_SECRET` - Exotel passthrough secret for webhooks

### Other

- `ASK_USER_TIMEOUT_MS` (default: 45000) - Timeout in milliseconds for user response during calls
- `PUBLIC_WS_URL` - Public WebSocket URL for the frontend

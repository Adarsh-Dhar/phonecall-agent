// Minimal test: replicates what listAllCalendarEvents does, using live credentials from the DB.
// Run: cd artifacts/api-server && node test-calendar.mjs
// (Must source root .env first so DATABASE_URL and GOOGLE_* are set)

import { google } from 'googleapis';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

// Query the DB directly with pg (available via prisma's deps)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use the built prisma client that the running server uses
// It's at dist/index.mjs's own prisma instance — but we can use pg directly
const pg = require('pg');
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

const res = await client.query(`SELECT "accessToken", "refreshToken", "expiryDate" FROM "GoogleAuth" WHERE id = 'default' LIMIT 1`);
await client.end();

if (res.rows.length === 0) { console.log('No GoogleAuth row found'); process.exit(1); }
const auth = res.rows[0];
console.log('Auth found. Expiry:', auth.expiryDate, '| Expired:', new Date(auth.expiryDate) < new Date());

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

console.log('GOOGLE_CLIENT_ID set:', !!GOOGLE_CLIENT_ID);
console.log('GOOGLE_CALENDAR_ID:', GOOGLE_CALENDAR_ID);

const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
oauth2Client.setCredentials({
  access_token: auth.accessToken,
  refresh_token: auth.refreshToken,
  expiry_date: new Date(auth.expiryDate).getTime(),
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Test 1: with timeMin (current code)
const timeMin = new Date();
timeMin.setFullYear(timeMin.getFullYear() - 1);
console.log('\n--- Test 1: singleEvents + timeMin (current code) ---');
try {
  const r = await calendar.events.list({
    calendarId: GOOGLE_CALENDAR_ID,
    singleEvents: true,
    orderBy: 'startTime',
    timeMin: timeMin.toISOString(),
  });
  console.log('OK — items:', r.data.items?.length ?? 0);
} catch (e) {
  console.log('ERROR:', e.message);
  console.log('Status:', e.status ?? e.code);
  if (e.response?.data) console.log('API body:', JSON.stringify(e.response.data, null, 2));
}

// Test 2: no singleEvents, no timeMin (safest)
console.log('\n--- Test 2: no singleEvents, no timeMin ---');
try {
  const r = await calendar.events.list({ calendarId: GOOGLE_CALENDAR_ID });
  console.log('OK — items:', r.data.items?.length ?? 0);
} catch (e) {
  console.log('ERROR:', e.message);
  if (e.response?.data) console.log('API body:', JSON.stringify(e.response.data, null, 2));
}

// Test 3: token refresh
console.log('\n--- Test 3: refreshAccessToken ---');
try {
  const { credentials } = await oauth2Client.refreshAccessToken();
  console.log('Refresh OK — new expiry:', credentials.expiry_date);
} catch (e) {
  console.log('Refresh ERROR:', e.message);
  if (e.response?.data) console.log('API body:', JSON.stringify(e.response.data, null, 2));
}

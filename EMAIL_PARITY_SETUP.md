# Email Parity — Setup Guide

This adds the missing half of email support on top of the outbound-only
scaffold: frontend wiring, inbound receiving, and AI auto-reply — matching
how phone calls already work end to end.

## What's new

| File | What it does |
|---|---|
| `prisma/schema.prisma` | `Message.emailId` link, `Email.receivedAt` |
| `services/geminiText.ts` | Shared Gemini text helper (extracted from `routes/gemini.ts` so chat + email reuse the same model-fallback logic) |
| `services/emailReply.ts` | Generates an AI reply to an inbound email using full conversation history + contact knowledge |
| `middlewares/verifyEmailInboundSecret.ts` | Verifies the shared-secret token on the inbound webhook (Inbound Parse has no Twilio signature) |
| `routes/emails.ts` | Outbound send now also writes a `Message` + triggers extraction; new `POST /emails/inbound` receives replies and auto-responds |
| `phone-agent/src/lib/api.ts` | `Email` type, `sendEmail`, `fetchEmail`, `fetchConversationEmails`; `Contact.email` added |
| `phone-agent/src/App.tsx` | `EmailControls` — compose popover next to the Call button |
| `seed.ts`, `.env.example` | `TEST_EMAIL_ADDRESS` so seeded contacts have a real inbox to test against |

## 1. Migrate

```bash
npx prisma migrate deploy
```
Picks up the new `20260823090000_add_message_email_link` migration.

## 2. Environment variables

Add to `.env`:
```
EMAIL_INBOUND_SECRET=<generate a long random value>
TEST_EMAIL_ADDRESS=you@example.com   # your real inbox, for seeding/testing
```

## 3. Configure Inbound Parse in the Twilio/SendGrid console

This is the one piece that's **console configuration, not code** — and it's
a different setup path than voice/SMS webhooks:

1. You need a domain (or subdomain) whose **MX records point at Twilio's
   mail servers** — this is not the same as `PUBLIC_BASE_URL`/ngrok. Inbound
   email has to actually be routed to Twilio at the DNS level.
2. In the console: **Settings → Inbound Parse** → add your hostname, and set
   the Destination URL to:
   ```
   https://your-domain/api/emails/inbound?token=<EMAIL_INBOUND_SECRET>
   ```
3. Contacts need email addresses at **that** domain for replies to route
   here — if your contact's email is `jane@gmail.com`, a reply from Jane
   goes to Gmail's servers, not yours. In practice this means: for a real
   two-way test, you send the *first* email from an address on your
   Inbound-Parse-configured domain, or you point a domain you own at Twilio
   specifically for this. Read `https://www.twilio.com/docs/sendgrid/for-developers/parsing-email/setting-up-the-inbound-parse-webhook` 
   before wiring this into anything real — the MX/DNS step trips people up.

## 4. How the loop works once configured

1. `POST /api/emails` (from the new "Email" button, or curl) sends a real
   outbound email via Twilio and writes it to the conversation as a
   `Message` — same as a call turn.
2. When the contact replies, Twilio/SendGrid POSTs the parsed email to
   `/api/emails/inbound`.
3. That handler: matches the sender to a `Contact` by email, writes the
   inbound `Message`, triggers task extraction, then calls
   `generateEmailReply()` (full conversation history + contact knowledge →
   Gemini) and sends the reply automatically via `sendOutboundEmail()`.
4. Both turns land in the same thread the chat/call UI already renders —
   no separate "email view" needed.

## 5. What to verify

- **Sender matching is exact-email-only right now.** If a contact's `email` 
  field doesn't match the inbound `From` address exactly (case-insensitive),
  the inbound email is dropped with a warning log, not an error. Worth
  hardening later (e.g. matching on domain, or falling back to an "unknown
  sender" conversation like inbound calls already do).
- **Auto-reply always fires.** There's no draft/approval step — every
  inbound email gets an AI-generated reply sent immediately. If you want a
  human-in-the-loop review step before sending, that's the next thing to
  add, not something this scaffold does.
- **No threading via `In-Reply-To`/`References` headers yet** — replies are
  matched to a conversation by "most recent conversation for this contact,"
  not proper email threading. Fine for a single active thread per contact;
  will misbehave if a contact has multiple concurrent email threads open.

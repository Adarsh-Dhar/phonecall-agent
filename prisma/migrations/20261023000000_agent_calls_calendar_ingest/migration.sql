-- AlterTable: let an individual's AI agent answer incoming business calls itself
ALTER TABLE "Account" ADD COLUMN "agentAutoAnswer" BOOLEAN NOT NULL DEFAULT false;

-- Calendar sync now lists events with singleEvents=true and a timeMin window (so it can
-- ingest brand-new "call" events, not only task-linked ones). A sync token is only valid
-- for the exact query that produced it, so drop the old ones: every account does one
-- clean full re-sync on the next poll.
UPDATE "Account" SET "syncToken" = NULL WHERE "syncToken" IS NOT NULL;

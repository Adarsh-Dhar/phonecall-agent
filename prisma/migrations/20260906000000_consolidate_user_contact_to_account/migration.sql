-- Migration: consolidate User + Contact into a single Account model
-- Strategy:
--   1. Rename "User" table to "Account", add new columns for service-account fields
--   2. Loosen previously NOT-NULL columns that are only meaningful for login accounts
--   3. Copy every Contact row into Account as a service account (same id — all existing FK values stay valid)
--   4. Re-point the 5 FK constraints that referenced Contact(id) to Account(id)
--   5. Drop the now-empty Contact table and its FK into the old User table

-- ============================================================
-- STEP 1 — Rename User → Account, add new columns
-- ============================================================

ALTER TABLE "User" RENAME TO "Account";

-- isService flag: false for every existing row (they are all login accounts)
ALTER TABLE "Account" ADD COLUMN "isService" BOOLEAN NOT NULL DEFAULT false;

-- Self-referential owner FK (null for login accounts; set for service accounts)
ALTER TABLE "Account" ADD COLUMN "ownerId" TEXT;

-- Contact-side fields that login accounts won't have
ALTER TABLE "Account" ADD COLUMN "business"  TEXT;
ALTER TABLE "Account" ADD COLUMN "category"  TEXT;
ALTER TABLE "Account" ADD COLUMN "phone"     TEXT;
ALTER TABLE "Account" ADD COLUMN "initials"  TEXT;
ALTER TABLE "Account" ADD COLUMN "color"     TEXT;
ALTER TABLE "Account" ADD COLUMN "note"      TEXT;
ALTER TABLE "Account" ADD COLUMN "online"    BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- STEP 2 — Relax columns that were NOT NULL on User but are
--           only relevant for login accounts (nullable on Account)
-- ============================================================

-- accessToken / refreshToken were NOT NULL DEFAULT "" on User
-- Keep the data; just allow NULL for service-account rows
ALTER TABLE "Account" ALTER COLUMN "accessToken"  DROP NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "refreshToken" DROP NOT NULL;

-- expiryDate and scope were NOT NULL on User
ALTER TABLE "Account" ALTER COLUMN "expiryDate" DROP NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "scope"      DROP NOT NULL;

-- name was nullable (TEXT?) on User — no change needed; it's still nullable

-- ============================================================
-- STEP 3 — Import every Contact row as a service account
--           Same id means every existing contactId FK stays valid
-- ============================================================

INSERT INTO "Account" (
    "id",
    "isService",
    "ownerId",
    "name",
    "business",
    "category",
    "phone",
    "initials",
    "color",
    "note",
    "online",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    true,
    "userId",
    "name",
    "business",
    "category",
    "phone",
    "initials",
    "color",
    "note",
    "online",
    "createdAt",
    "updatedAt"
FROM "Contact";

-- ============================================================
-- STEP 4 — Add indexes and FK for the new columns
-- ============================================================

CREATE INDEX "Account_ownerId_idx" ON "Account"("ownerId");

ALTER TABLE "Account" ADD CONSTRAINT "Account_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Re-create the unique indexes that were on User under the new table name
-- (Prisma already renamed them implicitly via the table rename, but we
--  explicitly drop+recreate to guarantee the correct name in pg_indexes)
DROP INDEX IF EXISTS "User_googleId_key";
DROP INDEX IF EXISTS "User_email_key";

CREATE UNIQUE INDEX "Account_googleId_key" ON "Account"("googleId");
CREATE UNIQUE INDEX "Account_email_key"    ON "Account"("email");

-- ============================================================
-- STEP 5 — Re-point FK constraints from Contact(id) → Account(id)
-- ============================================================

-- Conversation
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_contactId_fkey";
ALTER TABLE "Conversation" ADD  CONSTRAINT "Conversation_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Task
ALTER TABLE "Task" DROP CONSTRAINT "Task_contactId_fkey";
ALTER TABLE "Task" ADD  CONSTRAINT "Task_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Query
ALTER TABLE "Query" DROP CONSTRAINT "Query_contactId_fkey";
ALTER TABLE "Query" ADD  CONSTRAINT "Query_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Call
ALTER TABLE "Call" DROP CONSTRAINT "Call_contactId_fkey";
ALTER TABLE "Call" ADD  CONSTRAINT "Call_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ContactKnowledge
ALTER TABLE "ContactKnowledge" DROP CONSTRAINT "ContactKnowledge_contactId_fkey";
ALTER TABLE "ContactKnowledge" ADD  CONSTRAINT "ContactKnowledge_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- STEP 6 — Drop Contact table (and its FK into the old User)
-- ============================================================

-- The Contact → User FK is no longer needed; drop the table entirely.
-- All its rows have been migrated to Account in step 3.
DROP TABLE "Contact";

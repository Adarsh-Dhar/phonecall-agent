-- Add unique constraint on Account for contact deduplication (Change 11)
-- Prevents duplicate linked contacts for the same owner
CREATE UNIQUE INDEX IF NOT EXISTS "Account_ownerId_linkedAccountId_key"
ON "Account" ("ownerId", "linkedAccountId")
WHERE "isService" = true AND "linkedAccountId" IS NOT NULL;

-- Add partial unique index for ringing calls (Change 10)
-- Prevents multiple active ringing calls for the same individual/business pair
CREATE UNIQUE INDEX IF NOT EXISTS "active_call_per_pair"
ON "Call" ("individualId", "businessId")
WHERE "individualId" IS NOT NULL
  AND "businessId" IS NOT NULL
  AND status = 'ringing';

-- Add unique constraint for callback tasks (Change 10)
-- Prevents duplicate open call tasks for the same contact
-- Note: Index already exists, commented out to avoid conflict
-- CREATE UNIQUE INDEX IF NOT EXISTS "Task_contactId_kind_status_key"
-- ON "Task" ("contactId", "kind", "status")
-- WHERE kind = 'call' AND status = 'open';

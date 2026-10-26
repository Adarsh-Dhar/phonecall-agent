-- Chapter 4: Sale Day - Partial unique index for active calls
-- This prevents multiple ringing calls for the same individual/business pair
-- Only applies when both individualId and businessId are NOT NULL

-- First, drop any existing index (if it exists)
DROP INDEX IF EXISTS "active_call_per_pair";

-- Create partial unique index
CREATE UNIQUE INDEX "active_call_per_pair" ON "Call" ("individualId", "businessId")
WHERE "individualId" IS NOT NULL AND "businessId" IS NOT NULL;

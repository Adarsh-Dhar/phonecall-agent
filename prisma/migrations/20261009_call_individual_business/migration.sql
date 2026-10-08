-- Add individualId, businessId, initiatedBy columns to Call
ALTER TABLE "Call" ADD COLUMN "individualId" TEXT;
ALTER TABLE "Call" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Call" ADD COLUMN "initiatedBy" TEXT;

-- Add indexes for the new columns
CREATE INDEX "Call_individualId_idx" ON "Call"("individualId");
CREATE INDEX "Call_businessId_idx" ON "Call"("businessId");

-- Backfill existing calls
-- For each call, find the mirror contact owner and determine individual/business roles
-- If the dialer's mirror-contact owner is an individual, then individual→business
-- If the owner is a business, then business→individual

-- Outbound calls: dialer is the contact
-- If contact is a service account with an individual owner -> individual dialed business
UPDATE "Call"
SET
  "individualId" = (SELECT "ownerId" FROM "Account" WHERE "id" = "Call"."contactId" AND "isService" = true),
  "businessId" = (SELECT "id" FROM "Account" WHERE "id" = "Call"."contactId" AND "isService" = true),
  "initiatedBy" = 'individual'
WHERE "direction" = 'outbound'
AND "individualId" IS NULL
AND EXISTS (SELECT 1 FROM "Account" WHERE "id" = "Call"."contactId" AND "isService" = true AND "ownerId" IS NOT NULL);

-- Outbound calls: if contact is a business account -> business dialed individual
UPDATE "Call"
SET
  "individualId" = "calleeAccountId",
  "businessId" = (SELECT "id" FROM "Account" WHERE "id" = "Call"."contactId" AND "isService" = false),
  "initiatedBy" = 'business'
WHERE "direction" = 'outbound'
AND "individualId" IS NULL
AND EXISTS (SELECT 1 FROM "Account" WHERE "id" = "Call"."contactId" AND "isService" = false);

-- Inbound calls: dialer is the callee
-- If callee is an individual -> individual dialed business
UPDATE "Call"
SET
  "individualId" = "calleeAccountId",
  "businessId" = (SELECT "ownerId" FROM "Account" WHERE "id" = "Call"."contactId" AND "isService" = true),
  "initiatedBy" = 'individual'
WHERE "direction" = 'inbound'
AND "individualId" IS NULL
AND EXISTS (SELECT 1 FROM "Account" WHERE "id" = "Call"."calleeAccountId" AND "isService" = false);

-- Inbound calls: if callee is a service account with a business owner -> business dialed individual
UPDATE "Call"
SET
  "individualId" = (SELECT "ownerId" FROM "Account" WHERE "id" = "Call"."contactId" AND "isService" = true),
  "businessId" = (SELECT "ownerId" FROM "Account" WHERE "id" = "Call"."calleeAccountId" AND "isService" = true),
  "initiatedBy" = 'business'
WHERE "direction" = 'inbound'
AND "individualId" IS NULL
AND EXISTS (SELECT 1 FROM "Account" WHERE "id" = "Call"."calleeAccountId" AND "isService" = true AND "ownerId" IS NOT NULL);

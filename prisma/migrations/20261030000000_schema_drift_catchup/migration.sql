-- Migration to catch up schema drift
-- These columns/tables exist in schema.prisma but were not created by previous migrations

-- Account columns
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "responseConcise" BOOLEAN DEFAULT true;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "askClarifying" BOOLEAN DEFAULT true;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "confirmBeforeAction" BOOLEAN DEFAULT false;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "ownerResponseTimeoutSec" INTEGER;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "maxIntroCallsPerHour" INTEGER;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "maxMessagesPerContactPerDay" INTEGER;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "ringTimeoutSec" INTEGER;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "loopCheckinGraceMin" INTEGER;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "loopExpireDays" INTEGER;

-- ContactKnowledge column
ALTER TABLE "ContactKnowledge" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN DEFAULT false;

-- ApprovalRule column
ALTER TABLE "ApprovalRule" ADD COLUMN IF NOT EXISTS "condition" TEXT;

-- LiveQuery table
CREATE TABLE IF NOT EXISTS "LiveQuery" (
    id TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    query TEXT NOT NULL,
    "askedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    answer TEXT,
    "answeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveQuery_pkey" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "LiveQuery_callId_idx" ON "LiveQuery"("callId");
CREATE INDEX IF NOT EXISTS "LiveQuery_ownerId_idx" ON "LiveQuery"("ownerId");

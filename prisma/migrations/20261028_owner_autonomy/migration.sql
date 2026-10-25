-- Migration: Owner Autonomy Feature
-- Adds approval rules, handoff, lessons, and quality scoring for agent mode

-- Add digest fields to Account
ALTER TABLE "Account" ADD COLUMN "digestMode" TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE "Account" ADD COLUMN "digestHour" INTEGER NOT NULL DEFAULT 18;
ALTER TABLE "Account" ADD COLUMN "lastDigestAt" TIMESTAMP(3);

-- Add autonomy fields to Call
ALTER TABLE "Call" ADD COLUMN "autonomous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Call" ADD COLUMN "qualityScore" INTEGER;
ALTER TABLE "Call" ADD COLUMN "qualityJson" JSONB;
ALTER TABLE "Call" ADD COLUMN "qualityAt" TIMESTAMP(3);

-- Create ApprovalRule table
CREATE TABLE "ApprovalRule" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "contactId" TEXT,
    "category" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "params" JSONB,
    "note" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRule_pkey" PRIMARY KEY ("id")
);

-- Create index for ApprovalRule
CREATE INDEX "ApprovalRule_ownerId_enabled_idx" ON "ApprovalRule"("ownerId", "enabled");

-- Create RuleDecision table
CREATE TABLE "RuleDecision" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ruleId" TEXT,
    "category" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleDecision_pkey" PRIMARY KEY ("id")
);

-- Create indexes for RuleDecision
CREATE INDEX "RuleDecision_callId_idx" ON "RuleDecision"("callId");
CREATE INDEX "RuleDecision_ownerId_createdAt_idx" ON "RuleDecision"("ownerId", "createdAt");

-- Create Handoff table
CREATE TABLE "Handoff" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "liveSec" INTEGER,

    CONSTRAINT "Handoff_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Handoff
CREATE INDEX "Handoff_callId_idx" ON "Handoff"("callId");
CREATE INDEX "Handoff_ownerId_requestedAt_idx" ON "Handoff"("ownerId", "requestedAt");

-- Create PromptLesson table
CREATE TABLE "PromptLesson" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "contactId" TEXT,
    "code" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "seenCount" INTEGER NOT NULL DEFAULT 1,
    "appliedCount" INTEGER NOT NULL DEFAULT 0,
    "sourceCallId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptLesson_pkey" PRIMARY KEY ("id")
);

-- Create index for PromptLesson
CREATE INDEX "PromptLesson_ownerId_status_expiresAt_idx" ON "PromptLesson"("ownerId", "status", "expiresAt");

-- Add foreign key constraints
ALTER TABLE "ApprovalRule" ADD CONSTRAINT "ApprovalRule_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuleDecision" ADD CONSTRAINT "RuleDecision_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Handoff" ADD CONSTRAINT "Handoff_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Handoff" ADD CONSTRAINT "Handoff_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromptLesson" ADD CONSTRAINT "PromptLesson_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

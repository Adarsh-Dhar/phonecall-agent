-- Migration: Intro call when an individual and a business have saved each other
-- introStatus: none | queued | done | failed | cancelled
ALTER TABLE "Relationship" ADD COLUMN "introStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Relationship" ADD COLUMN "introTaskId" TEXT;
ALTER TABLE "Relationship" ADD COLUMN "introQueuedAt" TIMESTAMP(3);

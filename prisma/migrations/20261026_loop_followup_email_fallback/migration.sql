-- Follow-up on overdue promises: link a loop to the check-in task the sweeper creates
ALTER TABLE "OpenLoop" ADD COLUMN "followUpTaskId" TEXT;
ALTER TABLE "OpenLoop" ADD COLUMN "lastActionAt" TIMESTAMP(3);
CREATE INDEX "OpenLoop_status_dueAt_idx" ON "OpenLoop"("status", "dueAt");
CREATE INDEX "OpenLoop_followUpTaskId_idx" ON "OpenLoop"("followUpTaskId");

-- Email fallback when push / open tabs cannot be reached
ALTER TABLE "Account" ADD COLUMN "emailFallback" BOOLEAN NOT NULL DEFAULT true;

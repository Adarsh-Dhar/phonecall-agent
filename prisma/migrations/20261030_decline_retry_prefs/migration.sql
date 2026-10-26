-- Owner preferences for what the agent does when a business REJECTS its call:
-- wait declineRetryDelayMin minutes, recall up to declineMaxRetries times, then mark non-responsive.
ALTER TABLE "Account" ADD COLUMN "declineRetryDelayMin" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Account" ADD COLUMN "declineMaxRetries" INTEGER NOT NULL DEFAULT 2;

-- Rejections seen so far for this task (separate from callAttempts, which counts missed/offline dials).
ALTER TABLE "Task" ADD COLUMN "declineCount" INTEGER NOT NULL DEFAULT 0;

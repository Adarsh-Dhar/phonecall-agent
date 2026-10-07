-- AlterTable
ALTER TABLE "Account" ADD COLUMN "quietHoursStart" INTEGER,
ADD COLUMN "quietHoursEnd" INTEGER,
ADD COLUMN "businessHoursJson" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'call',
ADD COLUMN "callAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN "schedulerClaimedAt" TIMESTAMP(3),
ADD COLUMN "schedulerStatus" TEXT NOT NULL DEFAULT 'pending';

-- Backfill existing tasks
UPDATE "Task"
SET "nextAttemptAt" = "dueDate",
    "kind" = 'call',
    "schedulerStatus" = CASE
        WHEN "callTriggeredAt" IS NOT NULL THEN 'done'
        ELSE 'pending'
    END
WHERE "dueDate" IS NOT NULL;

-- Backfill tasks without due dates to pending status
UPDATE "Task"
SET "schedulerStatus" = 'pending'
WHERE "nextAttemptAt" IS NULL;

-- CreateIndex
CREATE INDEX "Task_schedulerStatus_nextAttemptAt_idx" ON "Task"("schedulerStatus", "nextAttemptAt");

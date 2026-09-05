-- AlterTable
-- Tracks when the call scheduler (services/callScheduler.ts) already
-- broadcast a "call_due" notification for this task, so a poll cycle
-- never triggers the same due task twice.
ALTER TABLE "Task" ADD COLUMN "callTriggeredAt" TIMESTAMP(3);

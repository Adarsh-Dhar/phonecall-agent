-- Add placedByAgent flag to Call table to distinguish agent-placed calls from manual calls
-- This prevents double-counting of call attempts by the scheduler
ALTER TABLE "Call" ADD COLUMN "placedByAgent" BOOLEAN NOT NULL DEFAULT false;

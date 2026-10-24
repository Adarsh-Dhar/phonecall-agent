-- Add meta column to Task table
ALTER TABLE "Task" ADD COLUMN "meta" JSONB;

-- Add indexes for parentTaskId and for filtering by contactId, kind, and status
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");
CREATE INDEX "Task_contactId_kind_status_idx" ON "Task"("contactId","kind","status");

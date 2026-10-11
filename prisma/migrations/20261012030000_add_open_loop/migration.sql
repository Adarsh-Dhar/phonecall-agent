-- CreateTable
CREATE TABLE "OpenLoop" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueAt" TIMESTAMP(3),
    "sourceCallId" TEXT,
    "taskId" TEXT,
    "queryId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'individual_only',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "OpenLoop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpenLoop_relationshipId_status_idx" ON "OpenLoop"("relationshipId", "status");

-- AddForeignKey
ALTER TABLE "OpenLoop" ADD CONSTRAINT "OpenLoop_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

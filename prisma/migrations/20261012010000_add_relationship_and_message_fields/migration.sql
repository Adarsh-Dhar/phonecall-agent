-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "individualId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "summaryUpTo" TIMESTAMP(3),
    "summaryVersion" INTEGER NOT NULL DEFAULT 0,
    "lastCallId" TEXT,
    "lastCallAt" TIMESTAMP(3),
    "consolidating" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_contactId_key" ON "Relationship"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_individualId_businessId_key" ON "Relationship"("individualId", "businessId");

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "relationshipId" TEXT,
ADD COLUMN "seq" BIGINT,
ADD COLUMN "speaker" TEXT,
ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'both';

-- CreateIndex
CREATE UNIQUE INDEX "Message_relationshipId_seq_key" ON "Message"("relationshipId", "seq");

-- CreateIndex
CREATE INDEX "Message_relationshipId_seq_idx" ON "Message"("relationshipId", "seq");

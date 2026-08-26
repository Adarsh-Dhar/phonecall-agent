-- AlterTable
ALTER TABLE "Email" ADD COLUMN "isEnoughKnowledge" BOOLEAN;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastExtractedMessageId" TEXT,
    "lastExtractedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "endedAt" DATETIME,
    "topicSummary" TEXT,
    "contactId" TEXT NOT NULL,
    CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Conversation" ("contactId", "createdAt", "id", "lastExtractedAt", "lastExtractedMessageId", "title", "updatedAt") SELECT "contactId", "createdAt", "id", "lastExtractedAt", "lastExtractedMessageId", "title", "updatedAt" FROM "Conversation";
DROP TABLE "Conversation";
ALTER TABLE "new_Conversation" RENAME TO "Conversation";
CREATE INDEX "Conversation_contactId_idx" ON "Conversation"("contactId");
CREATE INDEX "Conversation_contactId_status_idx" ON "Conversation"("contactId", "status");
CREATE TABLE "new_Query" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "answeredAt" DATETIME,
    "answerMessageId" TEXT,
    "isKnowledgeGap" BOOLEAN NOT NULL DEFAULT false,
    "knowledgeKey" TEXT,
    "knowledgeCategory" TEXT,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    CONSTRAINT "Query_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Query_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Query" ("answer", "answerMessageId", "answeredAt", "contactId", "conversationId", "createdAt", "id", "question", "status", "updatedAt") SELECT "answer", "answerMessageId", "answeredAt", "contactId", "conversationId", "createdAt", "id", "question", "status", "updatedAt" FROM "Query";
DROP TABLE "Query";
ALTER TABLE "new_Query" RENAME TO "Query";
CREATE INDEX "Query_conversationId_idx" ON "Query"("conversationId");
CREATE INDEX "Query_contactId_idx" ON "Query"("contactId");
CREATE INDEX "Query_status_idx" ON "Query"("status");
CREATE INDEX "Query_isKnowledgeGap_idx" ON "Query"("isKnowledgeGap");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

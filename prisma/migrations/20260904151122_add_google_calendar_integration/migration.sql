/*
  Warnings:

  - You are about to drop the column `exotelCallSid` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `streamSid` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Contact` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN "googleEtag" TEXT;
ALTER TABLE "Task" ADD COLUMN "googleEventId" TEXT;
ALTER TABLE "Task" ADD COLUMN "lastSyncedAt" DATETIME;

-- CreateTable
CREATE TABLE "GoogleAuth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "scope" TEXT NOT NULL,
    "syncToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Call" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "direction" TEXT NOT NULL DEFAULT 'outbound',
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "recordingUrl" TEXT,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "durationSec" INTEGER,
    "disconnectedBy" TEXT,
    "isEnoughKnowledge" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    CONSTRAINT "Call_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Call_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Call" ("contactId", "conversationId", "createdAt", "direction", "disconnectedBy", "durationSec", "endedAt", "from", "id", "isEnoughKnowledge", "recordingUrl", "startedAt", "status", "to", "updatedAt") SELECT "contactId", "conversationId", "createdAt", "direction", "disconnectedBy", "durationSec", "endedAt", "from", "id", "isEnoughKnowledge", "recordingUrl", "startedAt", "status", "to", "updatedAt" FROM "Call";
DROP TABLE "Call";
ALTER TABLE "new_Call" RENAME TO "Call";
CREATE INDEX "Call_conversationId_idx" ON "Call"("conversationId");
CREATE INDEX "Call_contactId_idx" ON "Call"("contactId");
CREATE INDEX "Call_status_idx" ON "Call"("status");
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "business" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "note" TEXT,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Contact" ("business", "category", "color", "createdAt", "id", "initials", "name", "note", "online", "phone", "updatedAt") SELECT "business", "category", "color", "createdAt", "id", "initials", "name", "note", "online", "phone", "updatedAt" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Task_googleEventId_idx" ON "Task"("googleEventId");

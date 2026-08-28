/*
  Warnings:

  - You are about to drop the `Call` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `callId` on the `Message` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Call_status_idx";

-- DropIndex
DROP INDEX "Call_contactId_idx";

-- DropIndex
DROP INDEX "Call_conversationId_idx";

-- DropIndex
DROP INDEX "Call_twilioSid_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Call";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "pending" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "conversationId" TEXT NOT NULL,
    "emailId" TEXT,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "conversationId", "createdAt", "emailId", "id", "pending", "role", "time", "updatedAt") SELECT "content", "conversationId", "createdAt", "emailId", "id", "pending", "role", "time", "updatedAt" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

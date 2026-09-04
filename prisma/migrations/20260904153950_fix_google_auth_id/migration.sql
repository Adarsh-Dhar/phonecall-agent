-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GoogleAuth" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "scope" TEXT NOT NULL,
    "syncToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GoogleAuth" ("accessToken", "createdAt", "expiryDate", "id", "refreshToken", "scope", "syncToken", "updatedAt") SELECT "accessToken", "createdAt", "expiryDate", "id", "refreshToken", "scope", "syncToken", "updatedAt" FROM "GoogleAuth";
DROP TABLE "GoogleAuth";
ALTER TABLE "new_GoogleAuth" RENAME TO "GoogleAuth";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

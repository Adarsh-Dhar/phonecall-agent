-- CreateTable
CREATE TABLE "ContactFile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactFile_ownerId_contactId_idx" ON "ContactFile"("ownerId", "contactId");

-- AddForeignKey
ALTER TABLE "ContactFile" ADD CONSTRAINT "ContactFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactFile" ADD CONSTRAINT "ContactFile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

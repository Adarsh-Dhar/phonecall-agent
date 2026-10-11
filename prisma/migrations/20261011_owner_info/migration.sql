-- Create OwnerInfo table
CREATE TABLE "OwnerInfo" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "shareable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerInfo_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on ownerId and key
CREATE UNIQUE INDEX "OwnerInfo_ownerId_key_key" ON "OwnerInfo"("ownerId", "key");

-- Create index on ownerId
CREATE INDEX "OwnerInfo_ownerId_idx" ON "OwnerInfo"("ownerId");

-- Add foreign key constraint
ALTER TABLE "OwnerInfo" ADD CONSTRAINT "OwnerInfo_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

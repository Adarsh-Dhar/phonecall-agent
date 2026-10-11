-- CreateTable
CREATE TABLE "BusinessClosure" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT,
    "message" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "blockCalls" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessClosure_businessId_startsAt_idx" ON "BusinessClosure"("businessId", "startsAt");

-- CreateIndex
CREATE INDEX "BusinessClosure_businessId_endsAt_idx" ON "BusinessClosure"("businessId", "endsAt");

-- AddForeignKey
ALTER TABLE "BusinessClosure" ADD CONSTRAINT "BusinessClosure_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

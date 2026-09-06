-- AlterTable
ALTER TABLE "Call" ADD COLUMN "calleeAccountId" TEXT;
ALTER TABLE "Call" ADD COLUMN "ringingAt" TIMESTAMP(3);
ALTER TABLE "Call" ADD COLUMN "acceptedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Account" ADD COLUMN "lastSeenAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Call_calleeAccountId_idx" ON "Call"("calleeAccountId");

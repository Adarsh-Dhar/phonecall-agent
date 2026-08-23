-- AlterTable
ALTER TABLE "Message" ADD COLUMN "emailId" TEXT;

-- AlterTable
ALTER TABLE "Email" ADD COLUMN "receivedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

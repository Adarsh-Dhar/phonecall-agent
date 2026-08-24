-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "email" TEXT;

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "twilioSid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "direction" TEXT NOT NULL DEFAULT 'outbound',
    "subject" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "body" TEXT,
    "html" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Email_twilioSid_key" ON "Email"("twilioSid");

-- CreateIndex
CREATE INDEX "Email_conversationId_idx" ON "Email"("conversationId");

-- CreateIndex
CREATE INDEX "Email_contactId_idx" ON "Email"("contactId");

-- CreateIndex
CREATE INDEX "Email_status_idx" ON "Email"("status");

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "emailId" TEXT;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

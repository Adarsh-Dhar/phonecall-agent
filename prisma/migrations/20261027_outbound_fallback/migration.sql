-- Business-side fallback: an email address for a contact (NOT unique: Account.email is the login
-- identity), and a per-contact opt-in. Off by default, so nothing is ever sent to a business
-- unless the owner turned it on for that contact.
ALTER TABLE "Account" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "Account" ADD COLUMN "allowFallbackMessage" BOOLEAN NOT NULL DEFAULT false;

-- Audit log + rate-limit source for every fallback message (owner or business).
CREATE TABLE "OutboundMessage" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "contactId" TEXT,
    "taskId" TEXT,
    "audience" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboundMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OutboundMessage_taskId_audience_status_createdAt_idx" ON "OutboundMessage"("taskId", "audience", "status", "createdAt");
CREATE INDEX "OutboundMessage_contactId_audience_status_createdAt_idx" ON "OutboundMessage"("contactId", "audience", "status", "createdAt");
CREATE INDEX "OutboundMessage_ownerId_createdAt_idx" ON "OutboundMessage"("ownerId", "createdAt");

ALTER TABLE "OutboundMessage" ADD CONSTRAINT "OutboundMessage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

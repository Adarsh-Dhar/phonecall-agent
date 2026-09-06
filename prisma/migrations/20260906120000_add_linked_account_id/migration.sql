-- Add linkedAccountId column to Account for tracking contact mirrors
ALTER TABLE "Account" ADD COLUMN "linkedAccountId" TEXT;

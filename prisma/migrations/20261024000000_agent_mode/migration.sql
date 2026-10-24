-- AlterTable: master "agent mode" switch for individuals. When true, the individual's AI agent
-- places scheduled calls and answers incoming business calls without the owner doing anything.
ALTER TABLE "Account" ADD COLUMN "agentMode" BOOLEAN NOT NULL DEFAULT false;

-- Keep the choice of everyone who already enabled auto-answer.
UPDATE "Account" SET "agentMode" = "agentAutoAnswer" WHERE "isService" = false AND "agentAutoAnswer" = true;

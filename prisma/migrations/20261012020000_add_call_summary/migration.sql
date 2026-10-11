-- CreateTable
CREATE TABLE "CallSummary" (
    "callId" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "agreements" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "proposals" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "promises" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "businessTerms" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model" TEXT NOT NULL,
    "promptVersion" INTEGER NOT NULL,

    CONSTRAINT "CallSummary_pkey" PRIMARY KEY ("callId")
);

-- CreateIndex
CREATE INDEX "CallSummary_relationshipId_idx" ON "CallSummary"("relationshipId");

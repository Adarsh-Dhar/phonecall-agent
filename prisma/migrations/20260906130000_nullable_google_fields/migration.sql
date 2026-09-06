-- Allow service-account rows to have NULL googleId and email.
-- These were NOT NULL on the original User model but must be nullable
-- on Account since service-account mirror rows have no Google identity.

ALTER TABLE "Account" ALTER COLUMN "googleId" DROP NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "email"    DROP NOT NULL;

-- The unique indexes must stay — Postgres treats each NULL as distinct,
-- so multiple NULL rows are fine and uniqueness is still enforced for
-- real login accounts that DO have a googleId/email.

-- Add credential authentication fields to User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "password" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);

-- Unique index on reset token for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS "User_passwordResetToken_key" ON "User"("passwordResetToken");

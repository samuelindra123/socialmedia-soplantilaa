-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "resetPasswordToken" TEXT,
  ADD COLUMN "resetPasswordOtp" TEXT,
  ADD COLUMN "resetPasswordOtpExpiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "backgroundProfileUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "websites" TEXT[] DEFAULT ARRAY[]::TEXT[];

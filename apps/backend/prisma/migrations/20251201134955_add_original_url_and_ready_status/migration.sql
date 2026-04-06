-- AlterEnum
ALTER TYPE "VideoStatus" ADD VALUE 'READY';

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "originalUrl" TEXT;

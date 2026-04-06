-- AlterTable
ALTER TABLE "PostVideo" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "originalUrl" TEXT,
ADD COLUMN     "processedUrl" TEXT,
ADD COLUMN     "qualityUrls" JSONB,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "width" INTEGER;

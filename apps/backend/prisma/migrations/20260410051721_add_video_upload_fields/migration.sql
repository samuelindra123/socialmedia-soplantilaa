-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "compressedSize" BIGINT,
ADD COLUMN     "originalSize" BIGINT,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "thumbnailId" TEXT,
ADD COLUMN     "videoId" TEXT;

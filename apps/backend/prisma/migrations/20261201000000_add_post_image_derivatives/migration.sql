-- AlterTable
ALTER TABLE "PostImage"
ADD COLUMN "thumbnailUrl" TEXT,
ADD COLUMN "blurhash" TEXT,
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "thumbnailWidth" INTEGER,
ADD COLUMN "thumbnailHeight" INTEGER;

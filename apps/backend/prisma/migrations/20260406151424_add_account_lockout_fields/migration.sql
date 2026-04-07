/*
  Warnings:

  - Added the required column `updatedAt` to the `Follow` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "FollowStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'MESSAGE';

-- AlterTable
ALTER TABLE "Follow" ADD COLUMN     "status" "FollowStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deletedForAll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mediaType" "MediaType",
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountLockedUntil" TIMESTAMP(3),
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ayt" (
    "id" INTEGER NOT NULL,
    "book" SMALLINT NOT NULL,
    "abbr" VARCHAR(10) NOT NULL,
    "chapter" SMALLINT NOT NULL,
    "verse" SMALLINT NOT NULL,
    "text" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "ayt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" SMALLINT NOT NULL,
    "abbr" VARCHAR(10) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" BIGSERIAL NOT NULL,
    "bookid" SMALLINT NOT NULL,
    "number" SMALLINT NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verse" (
    "id" INTEGER NOT NULL,
    "bookid" SMALLINT NOT NULL,
    "chapterid" BIGINT NOT NULL,
    "number" SMALLINT NOT NULL,
    "text" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Verse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_bookid_number_key" ON "Chapter"("bookid", "number");

-- CreateIndex
CREATE INDEX "Verse_book_chapter_number_idx" ON "Verse"("bookid", "chapterid", "number");

-- CreateIndex (requires pg_trgm extension - skip if not available)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Verse_text_trgm_idx" ON "Verse" USING GIN ("text" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Follow_followingId_status_idx" ON "Follow"("followingId", "status");

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_bookid_fkey" FOREIGN KEY ("bookid") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Verse" ADD CONSTRAINT "Verse_bookid_fkey" FOREIGN KEY ("bookid") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Verse" ADD CONSTRAINT "Verse_chapterid_fkey" FOREIGN KEY ("chapterid") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

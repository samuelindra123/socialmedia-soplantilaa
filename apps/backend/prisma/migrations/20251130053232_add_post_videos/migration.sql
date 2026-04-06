/*
  Warnings:

  - You are about to drop the column `isGroup` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageAt` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `isEdited` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `mediaUrl` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `messageType` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `bookmarkCount` on the `PostEngagement` table. All the data in the column will be lost.
  - You are about to drop the column `commentCount` on the `PostEngagement` table. All the data in the column will be lost.
  - You are about to drop the column `engagementScore` on the `PostEngagement` table. All the data in the column will be lost.
  - You are about to drop the column `likeCount` on the `PostEngagement` table. All the data in the column will be lost.
  - You are about to drop the column `shareCount` on the `PostEngagement` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `PostEngagement` table. All the data in the column will be lost.
  - You are about to drop the column `mediaType` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `StoryView` table. All the data in the column will be lost.
  - You are about to drop the column `affinityScore` on the `UserInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `targetUserId` on the `UserInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserInteraction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[storyId,viewerId]` on the table `StoryView` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `viewerId` to the `StoryView` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `UserInteraction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEW_POST', 'LIKE_POST', 'COMMENT_POST', 'SHARE_POST', 'SAVE_POST', 'FOLLOW_USER', 'VIEW_PROFILE', 'SEARCH_HASHTAG');

-- CreateEnum
CREATE TYPE "StoryType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP');

-- DropForeignKey
ALTER TABLE "StoryView" DROP CONSTRAINT "StoryView_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserInteraction" DROP CONSTRAINT "UserInteraction_targetUserId_fkey";

-- DropIndex
DROP INDEX "Conversation_lastMessageAt_idx";

-- DropIndex
DROP INDEX "ConversationParticipant_userId_idx";

-- DropIndex
DROP INDEX "Message_createdAt_idx";

-- DropIndex
DROP INDEX "Message_senderId_idx";

-- DropIndex
DROP INDEX "Notification_isRead_idx";

-- DropIndex
DROP INDEX "Notification_userId_idx";

-- DropIndex
DROP INDEX "PostEngagement_engagementScore_idx";

-- DropIndex
DROP INDEX "Story_expiresAt_idx";

-- DropIndex
DROP INDEX "StoryView_storyId_idx";

-- DropIndex
DROP INDEX "StoryView_storyId_userId_key";

-- DropIndex
DROP INDEX "StoryView_userId_idx";

-- DropIndex
DROP INDEX "UserInteraction_affinityScore_idx";

-- DropIndex
DROP INDEX "UserInteraction_userId_targetUserId_key";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "isGroup",
DROP COLUMN "lastMessageAt",
DROP COLUMN "name",
ADD COLUMN     "type" "ConversationType" NOT NULL DEFAULT 'DIRECT';

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "isDeleted",
DROP COLUMN "isEdited",
DROP COLUMN "mediaUrl",
DROP COLUMN "messageType";

-- AlterTable
ALTER TABLE "PostEngagement" DROP COLUMN "bookmarkCount",
DROP COLUMN "commentCount",
DROP COLUMN "engagementScore",
DROP COLUMN "likeCount",
DROP COLUMN "shareCount",
DROP COLUMN "viewCount",
ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shares" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "mediaType",
ADD COLUMN     "type" "StoryType" NOT NULL DEFAULT 'IMAGE';

-- AlterTable
ALTER TABLE "StoryView" DROP COLUMN "userId",
ADD COLUMN     "viewerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserInteraction" DROP COLUMN "affinityScore",
DROP COLUMN "targetUserId",
DROP COLUMN "updatedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "score" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "type" "InteractionType" NOT NULL;

-- DropEnum
DROP TYPE "MessageType";

-- DropEnum
DROP TYPE "StoryMediaType";

-- CreateTable
CREATE TABLE "PostVideo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" DOUBLE PRECISION,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryView_storyId_viewerId_key" ON "StoryView"("storyId", "viewerId");

-- CreateIndex
CREATE INDEX "UserInteraction_targetId_idx" ON "UserInteraction"("targetId");

-- AddForeignKey
ALTER TABLE "PostVideo" ADD CONSTRAINT "PostVideo_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

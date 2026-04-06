import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FollowStatus, Story } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { StoryThumbnailService } from './story-thumbnail.service';
import {
  CreateStoryDto,
  StoryMediaType,
  GetPresignedUrlsDto,
  CreateStoriesFromUrlsDto,
  MAX_STORY_FILE_SIZE_BYTES,
  MAX_STORY_VIDEO_DURATION_SECONDS,
} from './dto/create-story.dto';
import { CreateMultipleStoryDto } from './dto/create-multiple-story.dto';

@Injectable()
export class StoriesService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
    private thumbnailService: StoryThumbnailService,
  ) {}

  async getPresignedUrls(dto: GetPresignedUrlsDto) {
    if (!dto.files || dto.files.length === 0) {
      throw new BadRequestException('Minimal 1 file harus diupload');
    }

    if (dto.files.length > 10) {
      throw new BadRequestException('Maksimal 10 file per upload');
    }

    const urls = await this.spacesService.getMultiplePresignedUrls(
      'stories',
      dto.files,
    );

    return { urls };
  }

  async createStoriesFromUrls(userId: string, dto: CreateStoriesFromUrlsDto) {
    if (!dto.media || dto.media.length === 0) {
      throw new BadRequestException('Minimal 1 media harus ada');
    }

    if (dto.media.length > 10) {
      throw new BadRequestException('Maksimal 10 story per upload');
    }

    const stories: unknown[] = [];
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    for (const item of dto.media) {
      const story = await this.prisma.story.create({
        data: {
          userId,
          mediaUrl: item.mediaUrl,
          type: item.mediaType === StoryMediaType.VIDEO ? 'VIDEO' : 'IMAGE',
          caption: dto.caption,
          expiresAt,
        },
      });
      stories.push(story);
    }

    return stories;
  }

  async createStory(
    userId: string,
    dto: CreateStoryDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File media harus diupload');
    }

    const isVideo = dto.mediaType === StoryMediaType.VIDEO;

    // Validate file size (max 15 MB)
    if (file.size > MAX_STORY_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `Ukuran file terlalu besar. Maksimal ${MAX_STORY_FILE_SIZE_BYTES / 1024 / 1024} MB`,
      );
    }

    // Validate video duration (max 2 minutes)
    if (isVideo) {
      try {
        const metadata = await this.thumbnailService.getVideoMetadata(
          file.buffer,
          file.originalname,
        );

        if (metadata.duration > MAX_STORY_VIDEO_DURATION_SECONDS) {
          throw new BadRequestException(
            `Durasi video terlalu panjang. Maksimal ${MAX_STORY_VIDEO_DURATION_SECONDS / 60} menit`,
          );
        }
      } catch (err: unknown) {
        if (err instanceof BadRequestException) throw err;
        const message =
          err instanceof Error ? err.message : 'Unknown validation error';
        console.error('Failed to validate video duration:', message);
      }
    }

    // Upload original to Spaces
    const mediaUrl = await this.spacesService.uploadFile(file, 'stories');

    // Expire in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create story first (user sees it immediately)
    const story = await this.prisma.story.create({
      data: {
        userId,
        mediaUrl,
        type: isVideo ? 'VIDEO' : 'IMAGE',
        caption: dto.caption,
        expiresAt,
      },
    });

    // Generate preview + thumbnail for video in background
    if (isVideo) {
      void this.thumbnailService
        .generateStoryAssets(file.buffer, file.originalname)
        .then(async (assets) => {
          // Update story with preview and thumbnail
          await this.prisma.story
            .update({
              where: { id: story.id },
              data: {
                previewUrl: assets.previewUrl,
                thumbnailUrl: assets.thumbnailUrl,
              },
            })
            .catch(() => {});

          if (assets.previewUrl) {
            console.log(`✅ Story ${story.id} preview ready`);
          }
        })
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Unknown thumbnail error';
          console.error(`Failed to generate story assets: ${message}`);
        });
    }

    return story;
  }

  async getStoriesFeed(userId: string) {
    // Get stories from people the user follows + their own stories
    // That haven't expired
    const now = new Date();

    const following = await this.prisma.follow.findMany({
      where: { followerId: userId, status: FollowStatus.ACCEPTED },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    const userIds = [userId, ...followingIds];

    const stories = await this.prisma.story.findMany({
      where: {
        userId: { in: userIds },
        expiresAt: { gt: now },
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            profile: {
              select: {
                username: true,
                profileImageUrl: true,
              },
            },
          },
        },
        views: {
          where: { viewerId: userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by user
    const groupedStories = stories.reduce(
      (
        acc: Record<string, { user: any; stories: any[]; hasUnseen: boolean }>,
        story,
      ) => {
        const ownerId = story.userId;
        if (!acc[ownerId]) {
          acc[ownerId] = {
            user: story.user,
            stories: [],
            hasUnseen: false,
          };
        }

        const isSeen = Array.isArray(story.views) && story.views.length > 0;
        if (!isSeen) acc[ownerId].hasUnseen = true;

        acc[ownerId].stories.push({
          ...story,
          isSeen,
        });
        return acc;
      },
      {},
    );

    const groups = Object.entries(groupedStories).map(([ownerId, group]) => ({
      ownerId,
      ...group,
    }));

    return groups.sort((a, b) => {
      // Sort: Users with unseen stories first, then own story, then others
      if (a.ownerId === userId) return -1;
      if (b.ownerId === userId) return 1;
      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;
      return 0;
    });
  }

  async viewStory(userId: string, storyId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story tidak ditemukan');
    }

    // Don't record own views
    if (story.userId === userId) return;

    try {
      await this.prisma.storyView.create({
        data: {
          viewerId: userId,
          storyId,
        },
      });
    } catch {
      // Ignore duplicate views
    }

    return { message: 'Story viewed' };
  }

  async deleteStory(userId: string, storyId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story tidak ditemukan');
    }

    if (story.userId !== userId) {
      throw new BadRequestException(
        'Anda tidak memiliki akses untuk menghapus story ini',
      );
    }

    // Delete from spaces
    try {
      await this.spacesService.deleteFile(story.mediaUrl);
    } catch {
      // ignore
    }

    await this.prisma.story.delete({
      where: { id: storyId },
    });

    return { message: 'Story deleted' };
  }

  async createMultipleStories(
    userId: string,
    dto: CreateMultipleStoryDto,
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Minimal 1 file harus diupload');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maksimal 10 file per upload');
    }

    const stories: Story[] = [];

    for (const file of files) {
      // Validate file size (max 15 MB)
      if (file.size > MAX_STORY_FILE_SIZE_BYTES) {
        throw new BadRequestException(
          `Ukuran file "${file.originalname}" terlalu besar. Maksimal ${MAX_STORY_FILE_SIZE_BYTES / 1024 / 1024} MB`,
        );
      }

      // Determine media type from file
      const isVideo = file.mimetype.startsWith('video/');
      const mediaType = isVideo ? 'VIDEO' : 'IMAGE';

      // Validate video duration (max 2 minutes)
      if (isVideo) {
        try {
          const metadata = await this.thumbnailService.getVideoMetadata(
            file.buffer,
            file.originalname,
          );

          if (metadata.duration > MAX_STORY_VIDEO_DURATION_SECONDS) {
            throw new BadRequestException(
              `Durasi video "${file.originalname}" terlalu panjang. Maksimal ${MAX_STORY_VIDEO_DURATION_SECONDS / 60} menit`,
            );
          }
        } catch (err: unknown) {
          if (err instanceof BadRequestException) throw err;
          const message =
            err instanceof Error ? err.message : 'Unknown validation error';
          console.error('Failed to validate video duration:', message);
        }
      }

      // Upload to Spaces
      const mediaUrl = await this.spacesService.uploadFile(file, 'stories');

      // Expire in 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const story = await this.prisma.story.create({
        data: {
          userId,
          mediaUrl,
          type: mediaType,
          caption: dto.caption,
          expiresAt,
        },
      });

      // Generate preview + thumbnail for video in background
      if (isVideo) {
        this.thumbnailService
          .generateStoryAssets(file.buffer, file.originalname)
          .then(async (assets) => {
            await this.prisma.story
              .update({
                where: { id: story.id },
                data: {
                  previewUrl: assets.previewUrl,
                  thumbnailUrl: assets.thumbnailUrl,
                },
              })
              .catch(() => {});
          })
          .catch(() => {});
      }

      stories.push(story);
    }

    return stories;
  }
}

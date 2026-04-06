import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadVideoDto } from './dto/upload-video.dto';
import { VideoResponseDto } from './dto/video-response.dto';
import { ListVideosDto } from './dto/list-videos.dto';
import { VideoStatus } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  VIDEO_PROCESSING_JOB,
  VideoProcessingJob,
} from './queues/video-queues.module';
import { VideoStorageService } from './video-storage.service';
import { countWords, MAX_CONTENT_WORDS } from '../common/utils/word-count';
import { statSync } from 'fs';

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const ALLOWED_MIME = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'application/octet-stream',
];

/**
 * Service utama untuk orkestra upload, listing, dan penghapusan video.
 */
@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: VideoStorageService,
    @InjectQueue('video-processing')
    private readonly videoQueue: Queue<VideoProcessingJob>,
  ) {}

  /**
   * CHUNK-BASED PROCESSING: Queue video for chunk-based parallel encoding
   * File will be segmented, encoded in parallel, then uploaded
   */
  async enqueueUploads(
    userId: string,
    files: Express.Multer.File[],
    dto: UploadVideoDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Minimal unggah satu file video.');
    }

    if (countWords(dto.description) > MAX_CONTENT_WORDS) {
      throw new BadRequestException(
        `Deskripsi maksimal ${MAX_CONTENT_WORDS.toLocaleString('id-ID')} kata`,
      );
    }

    const responses: VideoResponseDto[] = [];

    for (const file of files) {
      this.ensureValidFile(file);

      // Get basic metadata
      const stats = statSync(file.path);

      // 🚀 INSTANT PREVIEW STRATEGY - Upload original FIRST
      // User dapat langsung menonton video original tanpa menunggu encoding
      const originalAsset = await this.storage.uploadOriginalVideo(
        file.path,
        file.mimetype || 'video/mp4',
      );

      // Create video record with READY status (not PROCESSING!)
      const video = await this.prisma.video.create({
        data: {
          title: dto.title ?? this.normalizeTitle(file.originalname),
          description: dto.description,
          userId,
          fileSize: stats.size,
          originalUrl: originalAsset.url, // ⚡ INSTANT PLAYBACK
          processedUrl: originalAsset.url, // Default to original
          status: VideoStatus.READY, // ✅ READY immediately!
        },
      });

      // 🎬 CREATE POST - Video muncul di Feed/Discover/Profile
      // Post harus dibuat agar video tampil di timeline

      // Process tags - ensure they are valid and create hashtags
      const validTags = (dto.tags || [])
        .map((t) =>
          t
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
            .slice(0, 30),
        )
        .filter((t) => t.length > 0)
        .slice(0, 10); // Max 10 tags

      const postCreated = await this.prisma.post.create({
        data: {
          title: dto.title ?? this.normalizeTitle(file.originalname),
          content:
            dto.description || dto.title || `Video: ${file.originalname}`,
          type: 'video', // Important: type='video'
          authorId: userId,
          videos: {
            create: {
              url: originalAsset.url, // Will be updated as qualities become available
              thumbnail: null, // Will be updated when thumbnail ready
              duration: null, // Will be updated when metadata extracted
            },
          },
          // Create hashtag relationships if tags provided
          ...(validTags.length > 0 && {
            hashtags: {
              create: await Promise.all(
                validTags.map(async (tagName) => {
                  // Upsert hashtag record
                  const hashtag = await this.prisma.hashtag.upsert({
                    where: { name: tagName },
                    update: { postCount: { increment: 1 } },
                    create: { name: tagName, postCount: 1 },
                  });
                  return { hashtagId: hashtag.id };
                }),
              ),
            },
          }),
        },
        include: {
          videos: true,
          hashtags: {
            include: {
              hashtag: true,
            },
          },
          author: {
            include: {
              profile: true,
            },
          },
        },
      });

      // Get PostVideo ID from created post
      const postVideoId = postCreated.videos?.[0]?.id;

      // Queue background job for thumbnail + multi-quality encoding
      await this.videoQueue.add(
        VIDEO_PROCESSING_JOB,
        {
          videoId: video.id,
          postId: postCreated.id, // ⚡ Pass postId
          postVideoId: postVideoId || '', // ⚡ Pass PostVideo ID for updates
          userId,
          filePath: file.path,
          originalUrl: originalAsset.url,
          originalName: file.originalname,
          mimeType: file.mimetype,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
        },
      );

      responses.push(VideoResponseDto.fromEntity(video));
    }

    return {
      message:
        'Video berhasil diupload! 🎬 Video sudah bisa ditonton sekarang. Kualitas lebih baik (144p-720p) sedang diproses di background.',
      items: responses,
    };
  }

  /**
   * Mengambil detail video milik user.
   */
  async getVideo(userId: string, videoId: string): Promise<VideoResponseDto> {
    const video = await this.prisma.video.findFirst({
      where: { id: videoId, userId, deletedAt: null },
    });

    if (!video) {
      throw new NotFoundException('Video tidak ditemukan.');
    }

    return VideoResponseDto.fromEntity(video);
  }

  /**
   * Mengambil daftar video user dengan pagination sederhana.
   */
  async listVideos(userId: string, query: ListVideosDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.video.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.video.count({ where: { userId, deletedAt: null } }),
    ]);

    return {
      data: items.map((item) => VideoResponseDto.fromEntity(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Soft delete video sekaligus menghapus aset di Spaces.
   */
  async deleteVideo(userId: string, videoId: string) {
    const video = await this.prisma.video.findFirst({
      where: { id: videoId, deletedAt: null },
    });
    if (!video) {
      throw new NotFoundException('Video tidak ditemukan atau sudah dihapus.');
    }
    if (video.userId !== userId) {
      throw new ForbiddenException('Anda tidak punya akses ke video ini.');
    }

    await this.prisma.video.update({
      where: { id: videoId },
      data: { deletedAt: new Date() },
    });

    await Promise.all([
      this.storage.deleteByUrl(video.originalUrl), // Delete original
      this.storage.deleteByUrl(video.processedUrl), // Delete optimized
      this.storage.deleteByUrl(video.thumbnailUrl), // Delete thumbnail
    ]);

    return { message: 'Video berhasil dihapus (soft delete).' };
  }

  private ensureValidFile(file: Express.Multer.File) {
    const ext = file.originalname?.split('.').pop()?.toLowerCase();
    const validExts = ['mp4', 'mov', 'avi'];

    if (
      !ALLOWED_MIME.includes(file.mimetype) &&
      !validExts.includes(ext || '')
    ) {
      throw new BadRequestException(
        `Format video harus mp4, mov, atau avi. Received: ${file.mimetype}`,
      );
    }
    if (file.size > MAX_VIDEO_SIZE) {
      throw new BadRequestException('Ukuran video maksimal 100MB.');
    }
    if (!file.path) {
      throw new BadRequestException(
        'File sementara tidak ditemukan di server.',
      );
    }
  }

  private normalizeTitle(filename: string) {
    return filename?.split('.')?.slice(0, -1).join('.') || 'Video tanpa judul';
  }
}

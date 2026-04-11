import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from './spaces.service';
import { v4 as uuidv4 } from 'uuid';

const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const ALLOWED_MIMES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  'video/avi',
];

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpacesService,
  ) {}

  async uploadVideo(
    videoFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File | undefined,
    userId: string,
    meta?: { width?: number; height?: number; duration?: number },
  ) {
    if (!videoFile) throw new BadRequestException('File video wajib ada');
    if (videoFile.size > MAX_VIDEO_SIZE)
      throw new BadRequestException('Ukuran video maksimal 200MB');
    if (!ALLOWED_MIMES.includes(videoFile.mimetype))
      throw new BadRequestException('Format tidak didukung. Gunakan MP4, MOV, WebM, atau AVI');

    const videoId = uuidv4();

    const [videoUrl, thumbnailUrl] = await Promise.all([
      this.spaces.uploadVideo(videoFile),
      thumbnailFile
        ? this.spaces.uploadThumbnail(thumbnailFile.buffer, videoId)
        : Promise.resolve<string | null>(null),
    ]);

    const video = await this.prisma.video.create({
      data: {
        id: videoId,
        userId,
        status: 'READY',
        progress: 100,
        processedUrl: videoUrl,
        thumbnailUrl,
        originalSize: BigInt(videoFile.size),
        title: videoFile.originalname,
        width: meta?.width,
        height: meta?.height,
        duration: meta?.duration,
      },
    });

    this.logger.log(`Video created: ${video.id} for user ${userId}`);
    return { id: video.id, status: 'READY' as const, videoUrl, thumbnailUrl };
  }

  async getVideoStatus(videoId: string, userId: string) {
    const video = await this.prisma.video.findFirst({
      where: { id: videoId, userId },
      select: {
        id: true,
        status: true,
        progress: true,
        processedUrl: true,
        thumbnailUrl: true,
      },
    });
    if (!video) throw new NotFoundException('Video tidak ditemukan');
    return video;
  }

  async getVideo(userId: string, videoId: string) {
    const video = await this.prisma.video.findFirst({
      where: { id: videoId, userId, deletedAt: null },
    });
    if (!video) throw new NotFoundException('Video tidak ditemukan.');
    return video;
  }

  async deleteVideo(userId: string, videoId: string) {
    const video = await this.prisma.video.findFirst({
      where: { id: videoId, deletedAt: null },
    });
    if (!video) throw new NotFoundException('Video tidak ditemukan atau sudah dihapus.');
    if (video.userId !== userId) throw new ForbiddenException('Anda tidak punya akses ke video ini.');

    await this.prisma.video.update({ where: { id: videoId }, data: { deletedAt: new Date() } });
    await Promise.all([
      this.spaces.deleteByUrl(video.processedUrl),
      this.spaces.deleteByUrl(video.thumbnailUrl),
    ]);

    return { message: 'Video berhasil dihapus.' };
  }
}

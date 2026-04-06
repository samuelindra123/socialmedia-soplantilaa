import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { PrismaModule } from '../prisma/prisma.module';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { VideoStorageService } from './video-storage.service';
import { VideoProcessorService } from './video-processor.service';
import { VideoQueuesModule } from './queues/video-queues.module';
import { VideoProcessingProcessor } from './queues/video-processors';
import { ResumableVideoUploadService } from './resumable-video-upload.service';

const uploadDir = join(process.cwd(), 'tmp', 'uploads', 'videos');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadDir),
        filename: (_req, file, cb) => {
          const uniqueName = `${Date.now()}-${randomUUID()}${extname(file.originalname) || '.mp4'}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 100 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'application/octet-stream',
        ];
        if (
          allowed.includes(file.mimetype) ||
          file.originalname.match(/\.(mp4|mov|avi)$/i)
        ) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type: ${file.mimetype}`), false);
        }
      },
    }),
    VideoQueuesModule,
    PrismaModule,
  ],
  controllers: [VideosController],
  providers: [
    VideosService,
    ResumableVideoUploadService,
    VideoStorageService,
    VideoProcessorService,
    VideoProcessingProcessor,
  ],
  exports: [VideosService],
})
export class VideosModule {}

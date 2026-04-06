import { ApiProperty } from '@nestjs/swagger';
import type { Video } from '@prisma/client';
import { VideoStatus } from '@prisma/client';

/**
 * DTO respons standar agar struktur data video konsisten di seluruh endpoint.
 */
export class VideoResponseDto {
  @ApiProperty({ description: 'ID unik video.' })
  id!: string;

  @ApiProperty({ description: 'Judul video.', required: false })
  title?: string | null;

  @ApiProperty({ description: 'Deskripsi video.', required: false })
  description?: string | null;

  @ApiProperty({
    description: 'URL video original (langsung bisa ditonton).',
    required: false,
  })
  originalUrl?: string | null;

  @ApiProperty({
    description: 'URL video terkompresi (primary quality).',
    required: false,
  })
  processedUrl?: string | null;

  @ApiProperty({
    description:
      'Multi-quality URLs untuk adaptive streaming (144p, 240p, 360p, 480p, 720p, 1080p)',
    required: false,
    type: Object,
    example: {
      '144p': 'https://cdn.example.com/videos/processed/144p/video.mp4',
      '240p': 'https://cdn.example.com/videos/processed/240p/video.mp4',
      '720p': 'https://cdn.example.com/videos/processed/720p/video.mp4',
    },
  })
  qualityUrls?: Record<string, string> | null;

  @ApiProperty({ description: 'URL thumbnail video.', required: false })
  thumbnailUrl?: string | null;

  @ApiProperty({ description: 'Durasi video dalam detik.', required: false })
  duration?: number | null;

  @ApiProperty({ description: 'Ukuran file terkompresi dalam byte.' })
  fileSize!: number;

  @ApiProperty({ description: 'Lebar video.', required: false })
  width?: number | null;

  @ApiProperty({ description: 'Tinggi video.', required: false })
  height?: number | null;

  @ApiProperty({ enum: VideoStatus, description: 'Status pemrosesan video.' })
  status!: VideoStatus;

  @ApiProperty({ description: 'Waktu pembuatan data.' })
  createdAt!: Date;

  @ApiProperty({ description: 'Waktu pembaruan terakhir.' })
  updatedAt!: Date;

  /**
   * Mengubah entitas Prisma menjadi DTO agar aman untuk dikirim ke klien.
   */
  static fromEntity(entity: Video): VideoResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      originalUrl: entity.originalUrl,
      processedUrl: entity.processedUrl,
      qualityUrls: entity.qualityUrls as Record<string, string> | null,
      thumbnailUrl: entity.thumbnailUrl,
      duration: entity.duration,
      fileSize: entity.fileSize,
      width: entity.width,
      height: entity.height,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

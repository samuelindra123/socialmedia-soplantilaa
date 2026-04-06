import { Injectable } from '@nestjs/common';
import { promises as fsPromises } from 'fs';
import { join, basename, dirname } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { SpacesService } from '../spaces/spaces.service';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

const ffmpegBinary = require('@ffmpeg-installer/ffmpeg');
const ffprobeBinary = require('@ffprobe-installer/ffprobe');

ffmpeg.setFfmpegPath(ffmpegBinary.path);
ffmpeg.setFfprobePath(ffprobeBinary.path);

export interface StoryVideoAssets {
  thumbnailUrl: string | null;
  previewUrl: string | null; // Low quality for instant playback
}

export interface VideoMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
}

@Injectable()
export class StoryThumbnailService {
  private readonly tempRoot = join(process.cwd(), 'tmp', 'story-processing');

  constructor(private readonly spacesService: SpacesService) {}

  /**
   * Generate both thumbnail and preview video for instant playback
   * Preview is 240p ultra-compressed for < 1 second load time
   */
  async generateStoryAssets(
    videoBuffer: Buffer,
    originalFilename: string,
  ): Promise<StoryVideoAssets> {
    const workDir = join(
      this.tempRoot,
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    );

    try {
      await fsPromises.mkdir(workDir, { recursive: true });

      // Write video buffer to temp file
      const videoPath = join(workDir, originalFilename);
      await fsPromises.writeFile(videoPath, videoBuffer);

      // Generate both in parallel
      const [thumbnailUrl, previewUrl] = await Promise.all([
        this.generateAndUploadThumbnail(videoPath, workDir),
        this.generateAndUploadPreview(videoPath, workDir),
      ]);

      return { thumbnailUrl, previewUrl };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown asset error';
      console.error('Failed to generate story assets:', message);
      return { thumbnailUrl: null, previewUrl: null };
    } finally {
      // Cleanup temp files
      await fsPromises
        .rm(workDir, { recursive: true, force: true })
        .catch(() => {});
    }
  }

  /**
   * Generate thumbnail from video buffer and upload to storage
   * Returns thumbnail URL or null if failed
   */
  async generateAndUploadThumbnail(
    videoPath: string,
    workDir: string,
  ): Promise<string | null> {
    try {
      const thumbnailPath = join(workDir, 'thumbnail.jpg');
      await this.generateThumbnail(videoPath, thumbnailPath);

      // Read thumbnail and upload
      const thumbnailBuffer = await fsPromises.readFile(thumbnailPath);

      const mockFile: Express.Multer.File = {
        buffer: thumbnailBuffer,
        originalname: 'thumbnail.jpg',
        mimetype: 'image/jpeg',
        size: thumbnailBuffer.length,
        fieldname: 'thumbnail',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const thumbnailUrl = await this.spacesService.uploadFile(
        mockFile,
        'story-thumbnails',
      );
      return thumbnailUrl;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown thumbnail error';
      console.error('Failed to generate thumbnail:', message);
      return null;
    }
  }

  /**
   * Generate ultra-low quality preview for instant playback
   * Target: < 500KB for 30 second video = instant load
   */
  async generateAndUploadPreview(
    videoPath: string,
    workDir: string,
  ): Promise<string | null> {
    try {
      const previewPath = join(workDir, 'preview.mp4');
      await this.generatePreviewVideo(videoPath, previewPath);

      // Read and upload
      const previewBuffer = await fsPromises.readFile(previewPath);

      const mockFile: Express.Multer.File = {
        buffer: previewBuffer,
        originalname: 'preview.mp4',
        mimetype: 'video/mp4',
        size: previewBuffer.length,
        fieldname: 'preview',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const previewUrl = await this.spacesService.uploadFile(
        mockFile,
        'story-previews',
      );
      console.log(
        `📱 Story preview generated: ${(previewBuffer.length / 1024).toFixed(0)}KB`,
      );
      return previewUrl;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown preview error';
      console.error('Failed to generate preview:', message);
      return null;
    }
  }

  /**
   * Generate thumbnail at 0.5 second mark
   */
  private generateThumbnail(
    videoPath: string,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', () => resolve())
        .on('error', (err) =>
          reject(err instanceof Error ? err : new Error(String(err))),
        )
        .screenshots({
          timestamps: ['00:00:00.500'],
          filename: basename(outputPath),
          folder: dirname(outputPath),
          size: '480x?',
        });
    });
  }

  /**
   * Generate 240p preview video - ultra fast encoding
   * - 240p resolution (tiny file size)
   * - ultrafast preset (fastest encoding)
   * - High CRF (lower quality = smaller file)
   * - faststart for instant streaming
   * - Short keyframe interval for instant seek
   */
  private generatePreviewVideo(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('426x240') // 240p
        .fps(24)
        .outputOptions([
          '-preset ultrafast',
          '-crf 35', // Lower quality = smaller file
          '-b:v 150k', // Very low bitrate
          '-maxrate 200k',
          '-bufsize 300k',
          '-movflags +faststart', // Instant streaming
          '-g 24', // Keyframe every 1 second
          '-keyint_min 24',
          '-sc_threshold 0',
          '-b:a 48k', // Low audio bitrate
          '-ac 1', // Mono audio
          '-ar 22050', // Lower sample rate
          '-threads 0',
          '-tune zerolatency',
        ])
        .on('end', () => resolve())
        .on('error', (err) =>
          reject(err instanceof Error ? err : new Error(String(err))),
        )
        .save(outputPath);
    });
  }

  /**
   * Get video metadata (duration, resolution) from buffer
   */
  async getVideoMetadata(
    videoBuffer: Buffer,
    filename: string,
  ): Promise<VideoMetadata> {
    const workDir = join(
      this.tempRoot,
      `probe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    );

    try {
      await fsPromises.mkdir(workDir, { recursive: true });
      const videoPath = join(workDir, filename);
      await fsPromises.writeFile(videoPath, videoBuffer);

      return await this.probeVideo(videoPath);
    } finally {
      await fsPromises
        .rm(workDir, { recursive: true, force: true })
        .catch(() => {});
    }
  }

  private probeVideo(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
          return;
        }

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === 'video',
        );
        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
        });
      });
    });
  }
}

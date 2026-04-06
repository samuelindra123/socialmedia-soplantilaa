import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VideoStatus } from '@prisma/client';
import { promises as fsPromises } from 'fs';
import { basename, dirname, join } from 'path';
import type { Job } from 'bull';
import ffmpeg from 'fluent-ffmpeg';
import { VideoStorageService } from './video-storage.service';
import { VideoProcessingJob } from './queues/video-queues.module';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-require-imports, @typescript-eslint/prefer-promise-reject-errors, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-return */

const ffmpegBinary = require('@ffmpeg-installer/ffmpeg');
const ffprobeBinary = require('@ffprobe-installer/ffprobe');

ffmpeg.setFfmpegPath(ffmpegBinary.path);
ffmpeg.setFfprobePath(ffprobeBinary.path);

interface ProcessedMetadata {
  duration?: number;
  width?: number;
  height?: number;
}

/**
 * Multi-quality video profiles - OPTIMIZED
 * Maksimal 720p, semua veryfast preset
 */
interface QualityProfile {
  name: string;
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
  preset: string;
  crf: number;
  priority: number; // Lower = higher priority (process first)
}

const QUALITY_PROFILES: QualityProfile[] = [
  // PREVIEW - SUPER FAST untuk instant playback (<5s untuk 10 menit video)
  {
    name: '144p',
    width: 256,
    height: 144,
    videoBitrate: '100k',
    audioBitrate: '48k',
    preset: 'ultrafast', // Tercepat untuk preview
    crf: 36,
    priority: 1,
  },
  {
    name: '240p',
    width: 426,
    height: 240,
    videoBitrate: '200k',
    audioBitrate: '64k',
    preset: 'ultrafast', // Cepat untuk mobile
    crf: 34,
    priority: 2,
  },
  // MID QUALITY - Fast for mobile (8-20s target)
  {
    name: '360p',
    width: 640,
    height: 360,
    videoBitrate: '400k',
    audioBitrate: '96k',
    preset: 'veryfast',
    crf: 30,
    priority: 3,
  },
  {
    name: '480p',
    width: 854,
    height: 480,
    videoBitrate: '800k',
    audioBitrate: '96k',
    preset: 'veryfast',
    crf: 28,
    priority: 4,
  },
  // HIGH QUALITY - Main viewing (20-45s target)
  {
    name: '720p',
    width: 1280,
    height: 720,
    videoBitrate: '2000k',
    audioBitrate: '128k',
    preset: 'veryfast',
    crf: 26,
    priority: 5,
  },
];

/**
 * Service yang menangani kompresi, thumbnail, dan sinkronisasi metadata video.
 */
@Injectable()
export class VideoProcessorService {
  [x: string]: any;
  private readonly tempRoot = join(process.cwd(), 'tmp', 'video-processing');

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: VideoStorageService,
  ) {}

  /**
   * Entry point yang dipanggil worker Bull untuk memproses job video.
   * NEW STRATEGY: Progressive multi-quality transcoding
   * 1. Upload original (instant playback)
   * 2. Generate 144p/240p preview (3-10s) → User sees video immediately
   * 3. Generate 360p/480p mid (8-20s) → Better quality
   * 4. Generate 720p HQ (20-45s) → Main quality
   * 5. Generate 1080p if needed (35-60s) → Optional
   */
  async handleJob(job: Job<VideoProcessingJob>) {
    const { videoId, postVideoId, filePath } = job.data;
    const workDir = join(this.tempRoot, videoId);

    await fsPromises.mkdir(workDir, { recursive: true });

    try {
      // Step 1: Probe video to get original dimensions
      await job.progress(5);
      const originalMetadata = await this.probeVideo(filePath);
      const inputHeight = originalMetadata.height || 720;

      // Determine which qualities to generate based on input
      const qualitiesToGenerate = this.selectQualities(inputHeight);

      console.log(
        `📹 Processing video ${videoId}: ${inputHeight}p input → Generating thumbnail + ${qualitiesToGenerate.map((q) => q.name).join(', ')}`,
      );

      // Step 2: Generate thumbnail IMMEDIATELY (for instant preview poster)
      // Instagram/TikTok strategy: thumbnail menghilangkan black screen
      const thumbnailPath = join(workDir, `${videoId}-thumbnail.jpg`);
      await this.generateThumbnail(filePath, thumbnailPath);
      await job.progress(10);

      // Step 3: Upload thumbnail immediately
      const thumbnailAsset = await this.storage.uploadThumbnail(
        thumbnailPath,
        'image/jpeg',
      );

      // Update with thumbnail + duration (user sees thumbnail instantly)
      await this.prisma.video.update({
        where: { id: videoId },
        data: {
          thumbnailUrl: thumbnailAsset.url,
          duration: originalMetadata.duration
            ? Math.round(originalMetadata.duration)
            : null,
          width: originalMetadata.width,
          height: originalMetadata.height,
        },
      });

      // 🎬 Update PostVideo with thumbnail
      if (postVideoId) {
        try {
          await this.prisma.postVideo.update({
            where: { id: postVideoId },
            data: {
              thumbnail: thumbnailAsset.url,
              duration: originalMetadata.duration,
            },
          });
        } catch (error) {
          console.error(
            `⚠️ Failed to update PostVideo thumbnail:`,
            error.message,
          );
        }
      }

      console.log(`📸 Thumbnail ready: ${thumbnailAsset.url}`);

      // Step 4: Process qualities in priority order (preview first!)
      const totalQualities = qualitiesToGenerate.length;
      const qualityUrls: Record<string, string> = {};

      for (let i = 0; i < qualitiesToGenerate.length; i++) {
        const profile = qualitiesToGenerate[i];
        const progressStart = 10 + (i * 80) / totalQualities;
        const progressEnd = 10 + ((i + 1) * 80) / totalQualities;

        console.log(
          `🎬 Transcoding ${profile.name} (${i + 1}/${totalQualities})...`,
        );

        const outputPath = join(workDir, `${videoId}-${profile.name}.mp4`);
        await this.transcodeToQuality(
          job,
          filePath,
          outputPath,
          profile,
          progressStart,
          progressEnd,
        );

        // Upload immediately after each quality is ready
        const videoAsset = await this.storage.uploadProcessedVideo(
          outputPath,
          'video/mp4',
          profile.name, // Store with quality name
        );

        qualityUrls[profile.name] = videoAsset.url;

        // Real-time update - frontend gets notified immediately!
        await this.updateVideoQualities(
          videoId,
          qualityUrls,
          profile.name,
          postVideoId,
        );

        console.log(`✅ ${profile.name} ready in ${videoAsset.url}`);
      }

      await job.progress(95);

      // Step 5: Mark as COMPLETED with all qualities
      const updatedVideo = await this.prisma.video.update({
        where: { id: videoId },
        data: {
          processedUrl: qualityUrls['720p'] || qualityUrls['480p'], // Primary quality
          width: originalMetadata.width,
          height: originalMetadata.height,
          status: VideoStatus.COMPLETED,
        },
      });

      await job.progress(100);
      console.log(
        `🎉 Video ${videoId} completed: ${Object.keys(qualityUrls).join(', ')}`,
      );

      return updatedVideo;
    } catch (error) {
      await this.prisma.video
        .update({
          where: { id: videoId },
          data: { status: VideoStatus.FAILED },
        })
        .catch(() => undefined);
      console.error(`❌ Failed to process video ${videoId}: ${error.message}`);
      throw error;
    } finally {
      await this.cleanupFiles([filePath, workDir]);
    }
  }

  /**
   * Select which quality profiles to generate based on input resolution
   * Rule: Never upscale, always include preview qualities
   */
  private selectQualities(inputHeight: number): QualityProfile[] {
    // Always generate preview qualities (144p, 240p)
    let profiles = QUALITY_PROFILES.filter(
      (p) => p.height <= inputHeight && p.height <= 1080, // Max 1080p output
    );

    // Sort by priority (preview first)
    profiles.sort((a, b) => a.priority - b.priority);

    // Ensure we have at least preview + one mid quality
    if (profiles.length === 0) {
      profiles = QUALITY_PROFILES.filter((p) => p.height <= 480);
    }

    return profiles;
  }

  /**
   * Update video record with new quality URL as soon as it's ready
   * Status progression: PROCESSING → READY (after 144p) → COMPLETED (after all)
   * Also updates PostVideo for feed/discover/profile display
   */
  private async updateVideoQualities(
    videoId: string,
    qualityUrls: Record<string, string>,
    latestQuality: string,
    postVideoId?: string, // ⚡ Optional PostVideo ID to update
  ) {
    const qualityCount = Object.keys(qualityUrls).length;
    const isFirstQuality = qualityCount === 1;
    const hasAllQualities = qualityCount >= 5; // 144p, 240p, 360p, 480p, 720p

    // Determine status
    let status: VideoStatus;
    if (hasAllQualities) {
      status = VideoStatus.COMPLETED; // All done!
    } else if (isFirstQuality) {
      status = VideoStatus.READY; // Preview ready - user can watch NOW!
    } else {
      status = VideoStatus.PROCESSING; // Still processing
    }

    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        status,
        processedUrl: qualityUrls['144p'] || qualityUrls[latestQuality], // Always prefer 144p for instant start
        qualityUrls: qualityUrls, // Store all available qualities
      },
    });

    // 🎬 UPDATE PostVideo - Video muncul di Feed dengan kualitas terbaru
    if (postVideoId) {
      try {
        // Determine best quality URL (prefer higher quality)
        const bestQualityUrl =
          qualityUrls['720p'] ||
          qualityUrls['480p'] ||
          qualityUrls['360p'] ||
          qualityUrls['240p'] ||
          qualityUrls['144p'];

        await this.prisma.postVideo.update({
          where: { id: postVideoId },
          data: {
            url: bestQualityUrl, // Show best quality available
            qualityUrls: qualityUrls, // Store all available qualities for frontend
            status: status, // READY/PROCESSING/COMPLETED
          },
        });
      } catch (error) {
        console.error(
          `⚠️ Failed to update PostVideo ${postVideoId}:`,
          error.message,
        );
      }
    }

    // Better logging
    if (isFirstQuality) {
      console.log(
        `🎉 Video ${videoId} READY! Preview (${latestQuality}) available - user dapat menonton SEKARANG!`,
      );
    } else if (hasAllQualities) {
      console.log(
        `✅ Video ${videoId} COMPLETED! Semua ${qualityCount} qualities tersedia`,
      );
    } else {
      console.log(
        `📡 Video ${videoId}: ${latestQuality} ready (${qualityCount}/5 qualities)`,
      );
    }
  }

  /**
   * Transcode video to specific quality profile
   * Optimized for SPEED - duration should NOT matter!
   */
  private async transcodeToQuality(
    job: Job,
    inputPath: string,
    outputPath: string,
    profile: QualityProfile,
    progressStart: number,
    progressEnd: number,
  ): Promise<void> {
    // Scale filter - maintain aspect ratio, never upscale
    const scaleFilter = `scale=w='min(${profile.width},iw)':h='min(${profile.height},ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoFilters(scaleFilter)
        .fps(30)
        .outputOptions([
          `-preset ${profile.preset}`,
          `-crf ${profile.crf}`,
          `-b:v ${profile.videoBitrate}`,
          `-maxrate ${profile.videoBitrate}`,
          `-bufsize ${parseInt(profile.videoBitrate) * 2}k`,
          '-movflags +faststart', // CRITICAL: moov atom di awal file
          '-pix_fmt yuv420p',
          '-c:a aac',
          `-b:a ${profile.audioBitrate}`,
          '-ac 2',
          '-threads 0',
          '-tune zerolatency',
          '-g 30', // ⚡ KEYFRAME every 1 second (30fps) - menghilangkan black screen
          '-keyint_min 30', // ⚡ Minimum keyframe interval
          '-sc_threshold 0', // Disable scene change detection
        ])
        .on('progress', (progress) => {
          const percent =
            progressStart +
            ((progressEnd - progressStart) * (progress.percent || 0)) / 100;
          job.progress(Math.round(percent));
        })
        .on('error', (err) => {
          console.error(`❌ FFmpeg error for ${profile.name}:`, err.message);
          reject(err);
        })
        .on('end', () => {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⚡ ${profile.name} transcoded in ${duration}s`);
          resolve();
        })
        .save(outputPath);
    });
  }

  private async transcodeVideo(
    job: Job,
    inputPath: string,
    outputPath: string,
  ): Promise<ProcessedMetadata> {
    const filter =
      'scale=w=trunc(min(1280/iw\\,720/ih)*iw/2)*2:h=trunc(min(1280/iw\\,720/ih)*ih/2)*2';

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoFilters(filter)
        .fps(30)
        .outputOptions([
          '-preset ultrafast', // CHANGED: veryfast → ultrafast (3-5x faster!)
          '-crf 30', // CHANGED: 28 → 30 (sedikit lower quality, jauh lebih cepat)
          '-movflags +faststart',
          '-pix_fmt yuv420p',
          '-c:a aac',
          '-b:a 96k', // CHANGED: 128k → 96k (lebih cepat encode, cukup untuk mobile)
          '-ac 2',
          '-threads 0', // NEW: use all CPU cores
          '-tune zerolatency', // NEW: optimize for fast encoding
        ])
        .on('progress', (progress) => {
          const percent = Math.min(70, Math.round(progress.percent ?? 0));
          job.progress(percent);
        })
        .on('error', (err) =>
          reject(err instanceof Error ? err : new Error(String(err))),
        )
        .on('end', async () => {
          const meta = await this.probeVideo(outputPath);
          resolve(meta);
        })
        .save(outputPath);
    });
  }

  private probeVideo(filePath: string): Promise<ProcessedMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) {
          return reject(err instanceof Error ? err : new Error(String(err)));
        }
        const videoStream = data.streams.find(
          (stream) => stream.width && stream.height,
        );
        resolve({
          duration: data.format?.duration,
          width: videoStream?.width,
          height: videoStream?.height,
        });
      });
    });
  }

  private async generateThumbnail(videoPath: string, outputPath: string) {
    return new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', () => resolve())
        .on('error', (err) =>
          reject(err instanceof Error ? err : new Error(String(err))),
        )
        .screenshots({
          timestamps: ['00:00:01.000'],
          filename: basename(outputPath),
          folder: dirname(outputPath),
          size: '640x?',
        });
    });
  }

  private async cleanupFiles(paths: string[]) {
    const tasks = paths
      .filter((p) => !!p)
      .map((p) =>
        fsPromises
          .rm(p, { recursive: true, force: true })
          .catch((err) =>
            console.error(
              `Gagal membersihkan file/dir sementara ${p}: ${err.message}`,
            ),
          ),
      );
    await Promise.all(tasks);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VideoStatus } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as fsSync from 'fs';
import type { Job } from 'bull';
import { VideoStorageService } from './video-storage.service';
import { VideoSegmenterService } from './services/video-segmenter.service';
import { ChunkEncoderService } from './services/chunk-encoder.service';
import { ChunkJoinerService } from './services/chunk-joiner.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

export const VIDEO_PROCESSING_JOB = 'compress-and-upload-video';
export const CHUNK_ENCODE_JOB = 'encode-chunk';

export interface VideoProcessingJob {
  videoId: string;
  userId: string;
  filePath: string;
  originalName: string;
  mimeType: string;
}

export interface ChunkEncodeJobData {
  videoId: string;
  chunkPath: string;
  chunkIndex: number;
  quality: string;
  encodedDir: string;
  totalChunks: number;
}

@Injectable()
export class ChunkBasedVideoProcessorService {
  private readonly logger = new Logger(ChunkBasedVideoProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: VideoStorageService,
    private readonly segmenter: VideoSegmenterService,
    private readonly encoder: ChunkEncoderService,
    private readonly joiner: ChunkJoinerService,
    @InjectQueue('video-processing') private readonly videoQueue: Queue,
    @InjectQueue('chunk-encoding') private readonly chunkQueue: Queue,
  ) {}

  /**
   * Main video processing handler with chunk-based parallel encoding
   *
   * WORKFLOW:
   * 1. Segment video into 3-second chunks (fast, copy mode)
   * 2. Dispatch all chunks to parallel encoding queue
   * 3. Workers encode chunks in parallel (20-30 concurrent)
   * 4. Track completion per quality
   * 5. Join chunks when all complete
   * 6. Upload to storage and cleanup
   *
   * PERFORMANCE TARGET:
   * 10-minute video → 60-90 seconds total (vs 1030s sequential)
   */
  async handleJob(job: Job<VideoProcessingJob>): Promise<void> {
    const { videoId, userId, filePath, originalName } = job.data;
    const startTime = Date.now();

    this.logger.log(`🎬 Starting chunk-based processing for video ${videoId}`);
    this.logger.log(`📂 File path: ${filePath}`);
    this.logger.log(
      `👤 User ${userId} started processing original file ${originalName}`,
    );

    // Verify file exists before processing
    if (!fsSync.existsSync(filePath)) {
      throw new Error(`File not found at start of processing: ${filePath}`);
    }
    this.logger.log(`✅ File verified: ${filePath}`);

    try {
      // PHASE 1: SEGMENTATION (Fast - copy mode, no encoding)
      // Target: 10-minute video → 5-10 seconds
      this.logger.log(`📹 Phase 1: Segmenting video...`);
      const segmentResult = await this.segmenter.segmentVideo(
        filePath,
        videoId,
      );

      this.logger.log(
        `✅ Segmented into ${segmentResult.chunkCount} chunks in ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      );

      // Get input resolution to determine qualities
      const { height: inputHeight } = await this.encoder.getVideoResolution(
        segmentResult.chunks[0],
      );
      const qualitiesToEncode = this.encoder.selectQualities(inputHeight);

      // Update video status with metadata
      await this.updateVideoProgress(videoId, {
        status: VideoStatus.PROCESSING,
        duration: Math.round(segmentResult.duration),
        height: inputHeight,
        metadata: {
          totalChunks: segmentResult.chunkCount,
          segmentedAt: new Date().toISOString(),
          qualities: qualitiesToEncode,
        },
      });

      this.logger.log(
        `🎯 Will encode ${qualitiesToEncode.length} qualities: ${qualitiesToEncode.join(', ')}`,
      );

      // PHASE 3: DISPATCH CHUNKS FOR PARALLEL ENCODING
      // Each chunk × each quality = separate job
      // Example: 200 chunks × 6 qualities = 1200 jobs
      // With 30 workers → ~40 jobs per worker → fast completion
      this.logger.log(
        `🚀 Phase 2: Dispatching ${segmentResult.chunkCount * qualitiesToEncode.length} encoding jobs...`,
      );

      const encodedDir = path.join(
        path.dirname(filePath),
        `encoded_${videoId}`,
      );

      // Track chunk encoding completion
      const chunkTracker = this.createChunkTracker(
        videoId,
        segmentResult.chunkCount,
        qualitiesToEncode,
      );

      // Dispatch all chunk encoding jobs
      await this.dispatchChunkEncodingJobs(
        videoId,
        segmentResult.chunks,
        qualitiesToEncode,
        encodedDir,
      );

      // PHASE 4: WAIT FOR COMPLETION & JOIN
      // This will be handled by chunk-encoding queue processor
      // When all chunks for a quality are done, join them
      // We update the tracker and check completion in the chunk processor

      // Store tracker in Redis for chunk processors to update
      await this.saveChunkTracker(videoId, chunkTracker);

      void job.progress(50); // Segmentation + dispatch complete

      this.logger.log(
        `✅ Dispatched all encoding jobs. Workers will process in parallel.`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Video processing failed: ${error.message}`,
        error.stack,
      );

      await this.prisma.video.update({
        where: { id: videoId },
        data: { status: VideoStatus.FAILED },
      });

      // Cleanup
      await this.cleanup(videoId, filePath);
      throw error;
    }
  }

  /**
   * Handle chunk encoding job
   * Runs in parallel workers (high concurrency)
   */
  async handleChunkEncodeJob(job: Job<ChunkEncodeJobData>): Promise<void> {
    const { videoId, chunkPath, chunkIndex, quality, encodedDir, totalChunks } =
      job.data;

    try {
      // Encode single chunk
      const result = await this.encoder.encodeChunk({
        chunkPath,
        chunkIndex,
        quality,
        outputDir: encodedDir,
        videoId,
      });

      if (!result.success) {
        throw new Error(`Chunk ${chunkIndex} encoding failed`);
      }

      // Update tracker
      await this.markChunkComplete(videoId, quality, chunkIndex);

      // Check if all chunks for this quality are complete
      const tracker = await this.getChunkTracker(videoId);
      const qualityComplete = this.isQualityComplete(
        tracker,
        quality,
        totalChunks,
      );

      if (qualityComplete) {
        this.logger.log(`🎉 All chunks for ${quality} complete! Joining...`);
        await this.joinAndUploadQuality(videoId, quality, encodedDir);
      }

      void job.progress(((chunkIndex + 1) / totalChunks) * 100);
    } catch (error) {
      this.logger.error(
        `Chunk ${chunkIndex} encoding failed: ${error.message}`,
      );
      // Will retry automatically via Bull
      throw error;
    }
  }

  /**
   * Dispatch all chunk encoding jobs to queue
   */
  private async dispatchChunkEncodingJobs(
    videoId: string,
    chunks: string[],
    qualities: string[],
    encodedDir: string,
  ): Promise<void> {
    const jobs: Promise<any>[] = [];

    for (const quality of qualities) {
      for (let i = 0; i < chunks.length; i++) {
        const jobData: ChunkEncodeJobData = {
          videoId,
          chunkPath: chunks[i],
          chunkIndex: i,
          quality,
          encodedDir,
          totalChunks: chunks.length,
        };

        jobs.push(
          this.chunkQueue.add(CHUNK_ENCODE_JOB, jobData, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          }),
        );
      }
    }

    await Promise.all(jobs);
    this.logger.log(`Dispatched ${jobs.length} chunk encoding jobs`);
  }

  /**
   * Join chunks for a quality and upload to storage
   */
  private async joinAndUploadQuality(
    videoId: string,
    quality: string,
    encodedDir: string,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Create final output directory
      const finalDir = path.join(path.dirname(encodedDir), `final_${videoId}`);

      // Join chunks
      const joinResult = await this.joiner.joinChunks(
        encodedDir,
        quality,
        finalDir,
        videoId,
      );

      if (!joinResult.success) {
        throw new Error(`Failed to join chunks for ${quality}`);
      }

      this.logger.log(
        `✅ Joined ${quality} in ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      );

      // Upload to storage
      const uploadResult = await this.storageService.uploadProcessedVideo(
        joinResult.outputPath,
        quality,
      );

      // Update database with this quality URL
      await this.addQualityUrl(videoId, quality, uploadResult.url);

      // Cleanup chunks for this quality
      await this.joiner.cleanupChunks(encodedDir, quality);

      this.logger.log(`✅ ${quality} uploaded and ready: ${uploadResult.url}`);

      // Check if all qualities are complete
      const tracker = await this.getChunkTracker(videoId);
      if (this.areAllQualitiesComplete(tracker)) {
        await this.finalizeVideo(videoId, encodedDir, finalDir);
      }
    } catch (error) {
      this.logger.error(`Failed to join/upload ${quality}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Finalize video processing after all qualities complete
   */
  private async finalizeVideo(
    videoId: string,
    encodedDir: string,
    finalDir: string,
  ): Promise<void> {
    this.logger.log(`🎉 All qualities complete for video ${videoId}`);

    // Update status to COMPLETED
    await this.prisma.video.update({
      where: { id: videoId },
      data: { status: VideoStatus.COMPLETED },
    });

    // Cleanup all temporary files
    await this.cleanup(videoId, '', encodedDir, finalDir);

    this.logger.log(`✅ Video ${videoId} processing complete!`);
  }

  /**
   * Create chunk completion tracker
   */
  private createChunkTracker(
    videoId: string,
    totalChunks: number,
    qualities: string[],
  ): any {
    const tracker = {
      videoId,
      totalChunks,
      qualities: {},
    };

    qualities.forEach((quality) => {
      tracker.qualities[quality] = {
        completedChunks: [],
        joined: false,
      };
    });

    return tracker;
  }

  /**
   * Save chunk tracker to Redis
   */
  private async saveChunkTracker(videoId: string, tracker: any): Promise<void> {
    // Store in video metadata for now
    // In production, use Redis for better performance
    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        metadata: tracker,
      },
    });
  }

  /**
   * Get chunk tracker
   */
  private async getChunkTracker(videoId: string): Promise<any> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { metadata: true },
    });

    return video?.metadata || {};
  }

  /**
   * Mark chunk as complete
   */
  private async markChunkComplete(
    videoId: string,
    quality: string,
    chunkIndex: number,
  ): Promise<void> {
    const tracker = await this.getChunkTracker(videoId);

    if (!tracker.qualities?.[quality]) {
      return;
    }

    if (!tracker.qualities[quality].completedChunks.includes(chunkIndex)) {
      tracker.qualities[quality].completedChunks.push(chunkIndex);
      await this.saveChunkTracker(videoId, tracker);
    }
  }

  /**
   * Check if all chunks for a quality are complete
   */
  private isQualityComplete(
    tracker: any,
    quality: string,
    totalChunks: number,
  ): boolean {
    const qualityTracker = tracker.qualities?.[quality];
    if (!qualityTracker) return false;

    return (
      qualityTracker.completedChunks.length === totalChunks &&
      !qualityTracker.joined
    );
  }

  /**
   * Check if all qualities are complete
   */
  private areAllQualitiesComplete(tracker: any): boolean {
    if (!tracker.qualities) return false;

    return Object.values(tracker.qualities).every(
      (q: any) => q.joined === true,
    );
  }

  /**
   * Add quality URL to database
   */
  private async addQualityUrl(
    videoId: string,
    quality: string,
    url: string,
  ): Promise<void> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { qualityUrls: true, status: true },
    });

    const qualityUrls = (video?.qualityUrls as any) || {};
    qualityUrls[quality] = url;

    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        qualityUrls: qualityUrls,
        status:
          video?.status === VideoStatus.READY
            ? VideoStatus.READY
            : VideoStatus.COMPLETED,
      },
    });

    // Mark quality as joined in tracker
    const tracker = await this.getChunkTracker(videoId);
    if (tracker.qualities?.[quality]) {
      tracker.qualities[quality].joined = true;
      await this.saveChunkTracker(videoId, tracker);
    }
  }

  /**
   * Update video processing progress
   */
  private async updateVideoProgress(videoId: string, data: any): Promise<void> {
    await this.prisma.video.update({
      where: { id: videoId },
      data,
    });
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(
    videoId: string,
    originalPath?: string,
    encodedDir?: string,
    finalDir?: string,
  ): Promise<void> {
    try {
      // Cleanup original upload from multer
      if (originalPath) {
        await fs.unlink(originalPath).catch(() => {});
      }

      // Cleanup persistent processing directory
      const processingDir = path.join(
        process.cwd(),
        'tmp',
        'processing',
        videoId,
      );
      await fs
        .rm(processingDir, { recursive: true, force: true })
        .catch(() => {});

      // Cleanup segment directory
      const segmentDir = originalPath
        ? path.join(path.dirname(originalPath), `segments_${videoId}`)
        : null;
      if (segmentDir) {
        await fs
          .rm(segmentDir, { recursive: true, force: true })
          .catch(() => {});
      }

      // Cleanup encoded directory
      if (encodedDir) {
        await fs
          .rm(encodedDir, { recursive: true, force: true })
          .catch(() => {});
      }

      // Cleanup final directory
      if (finalDir) {
        await fs.rm(finalDir, { recursive: true, force: true }).catch(() => {});
      }

      this.logger.log(`Cleanup complete for video ${videoId}`);
    } catch (error) {
      this.logger.warn(`Cleanup warning: ${error.message}`);
    }
  }
}

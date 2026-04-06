import { Injectable, Logger } from '@nestjs/common';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

// Set FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export interface SegmentResult {
  chunks: string[];
  chunkCount: number;
  segmentDir: string;
  duration: number;
}

@Injectable()
export class VideoSegmenterService {
  private readonly logger = new Logger(VideoSegmenterService.name);
  private readonly CHUNK_DURATION = 3; // seconds per chunk

  /**
   * Segment video into small chunks using FFmpeg copy mode (fast, no re-encoding)
   * 10-minute video → ~200 chunks of 3 seconds each
   */
  async segmentVideo(
    inputPath: string,
    videoId: string,
  ): Promise<SegmentResult> {
    const startTime = Date.now();

    // Create segment directory
    const segmentDir = path.join(
      path.dirname(inputPath),
      `segments_${videoId}`,
    );
    await fs.mkdir(segmentDir, { recursive: true });

    this.logger.log(
      `Segmenting video ${videoId} into ${this.CHUNK_DURATION}s chunks...`,
    );

    try {
      // Get video duration first
      const duration = await this.getVideoDuration(inputPath);
      const expectedChunks = Math.ceil(duration / this.CHUNK_DURATION);

      this.logger.log(
        `Video duration: ${duration}s, expected chunks: ${expectedChunks}`,
      );

      // Segment using FFmpeg (copy mode - no transcoding, very fast)
      await this.performSegmentation(inputPath, segmentDir);

      // Get list of generated chunks
      const chunks = await this.getChunkFiles(segmentDir);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(
        `✅ Segmentation complete: ${chunks.length} chunks in ${elapsed}s`,
      );

      return {
        chunks,
        chunkCount: chunks.length,
        segmentDir,
        duration,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown segmentation error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Segmentation failed: ${message}`, stack);
      // Cleanup on failure
      await this.cleanup(segmentDir);
      throw error;
    }
  }

  /**
   * Get video duration using FFprobe
   */
  private getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        } else {
          resolve(metadata.format.duration || 0);
        }
      });
    });
  }

  /**
   * Perform actual segmentation using FFmpeg
   * Uses -c copy for fast processing (no re-encoding)
   */
  private performSegmentation(
    inputPath: string,
    outputDir: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const outputPattern = path.join(outputDir, 'chunk_%04d.mp4');

      ffmpeg(inputPath)
        .outputOptions([
          '-c copy', // Copy mode - no transcoding!
          '-map 0', // Map all streams
          `-segment_time ${this.CHUNK_DURATION}`, // Chunk duration
          '-f segment', // Segment muxer
          '-reset_timestamps 1', // Reset timestamps for each chunk
        ])
        .output(outputPattern)
        .on('start', (cmdline) => {
          this.logger.debug(`FFmpeg command: ${cmdline}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            this.logger.debug(
              `Segmentation progress: ${progress.percent.toFixed(1)}%`,
            );
          }
        })
        .on('end', () => {
          this.logger.debug('Segmentation finished');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(`Segmentation error: ${err.message}`);
          reject(err instanceof Error ? err : new Error(String(err)));
        })
        .run();
    });
  }

  /**
   * Get list of chunk files sorted by name
   */
  private async getChunkFiles(segmentDir: string): Promise<string[]> {
    const files = await fs.readdir(segmentDir);
    const chunks = files
      .filter((file) => file.startsWith('chunk_') && file.endsWith('.ts'))
      .sort();

    return chunks.map((chunk) => path.join(segmentDir, chunk));
  }

  /**
   * Cleanup segment directory
   */
  async cleanup(segmentDir: string): Promise<void> {
    try {
      await fs.rm(segmentDir, { recursive: true, force: true });
      this.logger.log(`Cleaned up segment directory: ${segmentDir}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown cleanup error';
      this.logger.warn(`Cleanup failed: ${message}`);
    }
  }
}

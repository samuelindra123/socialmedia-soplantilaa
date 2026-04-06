import { Injectable, Logger } from '@nestjs/common';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

// Set FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export interface JoinResult {
  quality: string;
  outputPath: string;
  fileSize: number;
  success: boolean;
}

@Injectable()
export class ChunkJoinerService {
  private readonly logger = new Logger(ChunkJoinerService.name);

  /**
   * Join all encoded chunks for a specific quality into final MP4
   * Uses FFmpeg concat with copy mode (fast, no re-encoding)
   */
  async joinChunks(
    encodedDir: string,
    quality: string,
    outputDir: string,
    videoId: string,
  ): Promise<JoinResult> {
    const startTime = Date.now();

    try {
      // Get all chunk files for this quality
      const qualityDir = path.join(encodedDir, quality);
      const chunks = await this.getEncodedChunks(qualityDir, quality);

      if (chunks.length === 0) {
        throw new Error(`No chunks found for quality ${quality}`);
      }

      this.logger.log(`Joining ${chunks.length} chunks for ${quality}...`);

      // Create concat file list
      const concatFilePath = await this.createConcatFile(
        qualityDir,
        chunks,
        quality,
      );

      // Create final output directory
      await fs.mkdir(outputDir, { recursive: true });

      // Output filename: {videoId}_720p.mp4
      const outputPath = path.join(outputDir, `${videoId}_${quality}.mp4`);

      // Perform concat using FFmpeg
      await this.performConcat(concatFilePath, outputPath);

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(
        `✅ Joined ${quality}: ${(fileSize / 1024 / 1024).toFixed(2)}MB in ${elapsed}s`,
      );

      // Cleanup concat file
      await fs.unlink(concatFilePath);

      return {
        quality,
        outputPath,
        fileSize,
        success: true,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown join error';
      this.logger.error(`Failed to join chunks for ${quality}: ${message}`);
      return {
        quality,
        outputPath: '',
        fileSize: 0,
        success: false,
      };
    }
  }

  /**
   * Get all encoded chunk files for a quality, sorted
   */
  private async getEncodedChunks(
    qualityDir: string,
    quality: string,
  ): Promise<string[]> {
    const files = await fs.readdir(qualityDir);
    const chunks = files
      .filter((file) => file.endsWith(`_${quality}.ts`))
      .sort();

    return chunks.map((chunk) => path.join(qualityDir, chunk));
  }

  /**
   * Create concat file list for FFmpeg
   * Format:
   * file 'chunk_0001_720p.ts'
   * file 'chunk_0002_720p.ts'
   * ...
   */
  private async createConcatFile(
    qualityDir: string,
    chunks: string[],
    quality: string,
  ): Promise<string> {
    const concatFilePath = path.join(qualityDir, `concat_${quality}.txt`);

    // Create file list with relative paths
    const fileList = chunks
      .map((chunk) => {
        const filename = path.basename(chunk);
        return `file '${filename}'`;
      })
      .join('\n');

    await fs.writeFile(concatFilePath, fileList, 'utf-8');

    this.logger.debug(
      `Created concat file: ${concatFilePath} (${chunks.length} chunks)`,
    );

    return concatFilePath;
  }

  /**
   * Perform FFmpeg concat operation
   * Uses -c copy for fast processing (no re-encoding)
   */
  private performConcat(
    concatFilePath: string,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const concatDir = path.dirname(concatFilePath);

      ffmpeg()
        .input(concatFilePath)
        .inputOptions([
          '-f concat', // Concat demuxer
          '-safe 0', // Allow absolute paths
        ])
        .outputOptions([
          '-c copy', // Copy mode - no transcoding!
          '-movflags +faststart', // Fast start for web playback
        ])
        .output(outputPath)
        // Set working directory to concat file location
        .on('start', (cmdline) => {
          this.logger.debug(`FFmpeg concat: ${cmdline}`);
          this.logger.debug(`Working dir: ${concatDir}`);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(`Concat error: ${err.message}`);
          reject(err instanceof Error ? err : new Error(String(err)));
        })
        // Change working directory before running
        .run();
    });
  }

  /**
   * Cleanup encoded chunks after successful join
   */
  async cleanupChunks(encodedDir: string, quality: string): Promise<void> {
    try {
      const qualityDir = path.join(encodedDir, quality);
      await fs.rm(qualityDir, { recursive: true, force: true });
      this.logger.log(`Cleaned up chunks for ${quality}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown cleanup error';
      this.logger.warn(`Cleanup failed for ${quality}: ${message}`);
    }
  }
}

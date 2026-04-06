import { Injectable, Logger } from '@nestjs/common';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs/promises';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

// Set FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export interface ChunkEncodeJob {
  chunkPath: string;
  chunkIndex: number;
  quality: string;
  outputDir: string;
  videoId: string;
}

export interface ChunkEncodeResult {
  chunkIndex: number;
  quality: string;
  outputPath: string;
  success: boolean;
}

// Quality profiles - OPTIMIZED: Maksimal 720p, semua veryfast preset
const QUALITY_PROFILES = {
  '144p': {
    height: 144,
    preset: 'veryfast',
    crf: 35,
    videoBitrate: '100k',
    audioBitrate: '48k',
  },
  '240p': {
    height: 240,
    preset: 'veryfast',
    crf: 33,
    videoBitrate: '200k',
    audioBitrate: '64k',
  },
  '360p': {
    height: 360,
    preset: 'veryfast',
    crf: 30,
    videoBitrate: '400k',
    audioBitrate: '96k',
  },
  '480p': {
    height: 480,
    preset: 'veryfast',
    crf: 28,
    videoBitrate: '800k',
    audioBitrate: '96k',
  },
  '720p': {
    height: 720,
    preset: 'veryfast',
    crf: 26,
    videoBitrate: '2000k',
    audioBitrate: '128k',
  },
};

@Injectable()
export class ChunkEncoderService {
  private readonly logger = new Logger(ChunkEncoderService.name);

  /**
   * Encode a single chunk to specific quality
   * This runs in parallel for multiple chunks
   */
  async encodeChunk(job: ChunkEncodeJob): Promise<ChunkEncodeResult> {
    const { chunkPath, chunkIndex, quality, outputDir, videoId } = job;
    const profile = QUALITY_PROFILES[quality];

    if (!profile) {
      throw new Error(`Invalid quality: ${quality}`);
    }

    // Create output directory for this quality
    const qualityDir = path.join(outputDir, quality);
    await fs.mkdir(qualityDir, { recursive: true });

    // Output filename: chunk_0001_720p.ts
    const chunkName = path.basename(chunkPath, '.ts');
    const outputPath = path.join(qualityDir, `${chunkName}_${quality}.ts`);

    this.logger.debug(
      `Encoding chunk ${chunkIndex} for video ${videoId} to ${quality} (preset: ${profile.preset})`,
    );

    try {
      await this.performEncode(chunkPath, outputPath, profile);

      return {
        chunkIndex,
        quality,
        outputPath,
        success: true,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown encoding error';
      this.logger.error(
        `Failed to encode chunk ${chunkIndex} to ${quality}: ${message}`,
      );
      return {
        chunkIndex,
        quality,
        outputPath: '',
        success: false,
      };
    }
  }

  /**
   * Perform FFmpeg encoding for a chunk
   */
  private performEncode(
    inputPath: string,
    outputPath: string,
    profile: any,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-c:v libx264`, // Video codec
          `-preset ${profile.preset}`, // Encoding speed
          `-crf ${profile.crf}`, // Quality
          `-b:v ${profile.videoBitrate}`, // Video bitrate
          `-maxrate ${profile.videoBitrate}`, // Max bitrate
          `-bufsize ${parseInt(profile.videoBitrate) * 2}k`, // Buffer size
          `-vf scale=-2:${profile.height}`, // Scale filter (no upscale)
          `-c:a aac`, // Audio codec
          `-b:a ${profile.audioBitrate}`, // Audio bitrate
          `-ar 44100`, // Audio sample rate
          `-movflags +faststart`, // Fast start for web
        ])
        .output(outputPath)
        .on('start', (cmdline) => {
          this.logger.debug(`FFmpeg: ${cmdline}`);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err instanceof Error ? err : new Error(String(err)));
        })
        .run();
    });
  }

  /**
   * Get input video resolution to determine which qualities to encode
   */
  async getVideoResolution(filePath: string): Promise<{
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        } else {
          const videoStream = metadata.streams.find(
            (s) => s.codec_type === 'video',
          );
          if (videoStream) {
            resolve({
              width: videoStream.width || 0,
              height: videoStream.height || 0,
            });
          } else {
            reject(new Error('No video stream found'));
          }
        }
      });
    });
  }

  /**
   * Select qualities to encode based on input resolution
   * OPTIMIZED: Maksimal 720p, tidak upscale
   */
  selectQualities(inputHeight: number): string[] {
    const allQualities = Object.keys(QUALITY_PROFILES);
    return allQualities.filter((quality) => {
      const profile = QUALITY_PROFILES[quality];
      // Maksimal 720p, tidak upscale
      return profile.height <= inputHeight && profile.height <= 720;
    });
  }
}

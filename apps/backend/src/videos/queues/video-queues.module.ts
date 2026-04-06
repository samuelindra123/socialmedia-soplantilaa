import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

/**
 * Chunk-based video processing queues
 *
 * TWO QUEUES:
 * 1. video-processing: Main orchestrator (1 job per video)
 *    - Segments video into chunks
 *    - Dispatches chunk encoding jobs
 *    - Low concurrency (1-3 workers)
 *
 * 2. chunk-encoding: Parallel chunk encoder (many jobs)
 *    - Encodes individual chunks
 *    - High concurrency (20-50 workers)
 *    - Joins chunks when quality complete
 */

export const VIDEO_PROCESSING_QUEUE = 'video-processing';
export const CHUNK_ENCODING_QUEUE = 'chunk-encoding';

export const VIDEO_PROCESSING_JOB = 'compress-and-upload-video';
export const CHUNK_ENCODE_JOB = 'encode-chunk';

export interface VideoProcessingJob {
  videoId: string;
  postId: string; // ⚡ Post ID to update PostVideo
  postVideoId: string; // ⚡ PostVideo ID to update with qualities
  userId: string;
  filePath: string;
  originalUrl: string; // URL to original uploaded file (for instant playback)
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

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: VIDEO_PROCESSING_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: CHUNK_ENCODING_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    ),
  ],
  exports: [BullModule],
})
export class VideoQueuesModule {}

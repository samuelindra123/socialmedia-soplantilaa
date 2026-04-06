import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { VideoProcessorService } from '../video-processor.service';
import {
  VIDEO_PROCESSING_JOB,
  VideoProcessingJob,
} from './video-queues.module';

/**
 * Main video processing queue processor
 * SIMPLE SEQUENTIAL PROCESSING - Maksimal 720p, veryfast preset
 */
@Processor('video-processing')
export class VideoProcessingProcessor {
  private readonly logger = new Logger(VideoProcessingProcessor.name);

  constructor(private readonly processor: VideoProcessorService) {}

  @Process({
    name: VIDEO_PROCESSING_JOB,
    concurrency: 1, // Sequential processing
  })
  async handleVideoProcessing(job: Job<VideoProcessingJob>) {
    this.logger.log(
      `Processing video job ${job.id} for video ${job.data.videoId}`,
    );

    try {
      await this.processor.handleJob(job);
      this.logger.log(`Video job ${job.id} completed successfully`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown video job error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Video job ${job.id} failed: ${message}`, stack);
      throw error;
    }
  }
}

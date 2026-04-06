import {
  Process,
  Processor,
  OnQueueFailed,
  OnQueueCompleted,
} from '@nestjs/bull';
import type { Job } from 'bull';
import type { Video } from '@prisma/client';
import { VideoProcessorService } from '../video-processor.service';
import {
  VIDEO_PROCESSING_QUEUE,
  VIDEO_PROCESSING_JOB,
  VideoProcessingJob,
} from './video-queues.module';

@Processor(VIDEO_PROCESSING_QUEUE)
export class VideoProcessingConsumer {
  constructor(private readonly videoProcessorService: VideoProcessorService) {}

  @Process({ name: VIDEO_PROCESSING_JOB, concurrency: 1 }) // Sequential processing
  async handle(job: Job<VideoProcessingJob>): Promise<Video> {
    return this.videoProcessorService.handleJob(job);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<VideoProcessingJob>) {
    console.log(
      `✅ Job video ${job.data.videoId} selesai diproses dalam antrean video-processing`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<VideoProcessingJob>, error: Error) {
    console.error(
      `❌ Job video ${job?.data?.videoId ?? 'tanpa-id'} gagal diproses: ${error.message}`,
    );
  }
}

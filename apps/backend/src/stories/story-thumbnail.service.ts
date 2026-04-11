import { Injectable, Logger } from '@nestjs/common';

/**
 * Stub service — thumbnail generation dilakukan di frontend via Canvas API.
 * Backend tidak lagi membutuhkan ffmpeg.
 */
@Injectable()
export class StoryThumbnailService {
  private readonly logger = new Logger(StoryThumbnailService.name);

  async generateVideoThumbnail(_videoPath: string): Promise<string | null> {
    this.logger.log('Thumbnail generation skipped — handled by frontend Canvas API');
    return null;
  }

  async getVideoMetadata(_videoPath: string): Promise<{ duration: number; width: number; height: number }> {
    return { duration: 0, width: 0, height: 0 };
  }

  async cleanupFile(_filePath: string): Promise<void> {
    // no-op
  }
}

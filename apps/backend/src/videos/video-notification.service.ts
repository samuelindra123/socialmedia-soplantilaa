import { Injectable } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';

/**
 * Service untuk mengirim notifikasi real-time ke user
 * ketika video selesai diproses
 */
@Injectable()
export class VideoNotificationService {
  constructor(private readonly eventsGateway: EventsGateway) {}

  /**
   * Notify user via WebSocket that video processing is complete
   */
  notifyVideoCompleted(userId: string, videoId: string, videoUrl: string) {
    this.eventsGateway.server.to(`user:${userId}`).emit('video:completed', {
      videoId,
      videoUrl,
      message: 'Video Anda sudah siap!',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify user via WebSocket that video processing failed
   */
  notifyVideoFailed(userId: string, videoId: string, error: string) {
    this.eventsGateway.server.to(`user:${userId}`).emit('video:failed', {
      videoId,
      error,
      message: 'Maaf, video gagal diproses.',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send processing progress updates
   */
  notifyVideoProgress(userId: string, videoId: string, progress: number) {
    this.eventsGateway.server.to(`user:${userId}`).emit('video:progress', {
      videoId,
      progress,
      timestamp: new Date().toISOString(),
    });
  }
}

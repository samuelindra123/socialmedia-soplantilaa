import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedUsers.delete(client.id);
  }

  // User joins with their userId to receive personalized events
  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data.userId) {
      this.connectedUsers.set(client.id, data.userId);
      void client.join(`user:${data.userId}`);
      this.logger.log(`User ${data.userId} joined`);
    }
  }

  // Join feed room to receive new posts
  @SubscribeMessage('join-feed')
  handleJoinFeed(@ConnectedSocket() client: Socket) {
    void client.join('feed');
    this.logger.log(`Client ${client.id} joined feed room`);
  }

  // Leave feed room
  @SubscribeMessage('leave-feed')
  handleLeaveFeed(@ConnectedSocket() client: Socket) {
    void client.leave('feed');
    this.logger.log(`Client ${client.id} left feed room`);
  }

  // === Emit methods to be called from services ===

  // Emit new post to all users in feed room
  emitNewPost(post: { id?: string } & Record<string, unknown>) {
    void this.server.to('feed').emit('new-post', post);
    this.logger.log(`Emitted new-post: ${post.id}`);
  }

  // Emit post update (like count, etc)
  emitPostUpdate(postId: string, data: Record<string, unknown>) {
    void this.server.to('feed').emit('post-update', { postId, ...data });
  }

  // Emit new comment
  emitNewComment(postId: string, comment: Record<string, unknown>) {
    void this.server.to('feed').emit('new-comment', { postId, comment });
    this.logger.log(`Emitted new-comment for post ${postId}`);
  }

  // Emit post deleted
  emitPostDeleted(postId: string) {
    void this.server.to('feed').emit('post-deleted', { postId });
  }

  // Emit notification to specific user
  emitNotification(userId: string, notification: unknown) {
    void this.server.to(`user:${userId}`).emit('notification', notification);
  }

  // Emit like update
  emitLikeUpdate(
    postId: string,
    likesCount: number,
    userId: string,
    liked: boolean,
  ) {
    void this.server
      .to('feed')
      .emit('like-update', { postId, likesCount, userId, liked });
    this.logger.log(
      `Emitted like-update for post ${postId}: ${likesCount} likes`,
    );
  }

  // Emit comment like update
  emitCommentLikeUpdate(
    postId: string,
    commentId: string,
    likesCount: number,
    userId: string,
    liked: boolean,
  ) {
    void this.server.to('feed').emit('comment-like-update', {
      postId,
      commentId,
      likesCount,
      userId,
      liked,
    });
    this.logger.log(
      `Emitted comment-like-update for comment ${commentId}: ${likesCount} likes`,
    );
  }

  // Emit comment deleted
  emitCommentDeleted(postId: string, commentId: string) {
    void this.server.to('feed').emit('comment-deleted', { postId, commentId });
    this.logger.log(`Emitted comment-deleted for comment ${commentId}`);
  }

  // Emit upload status to specific user for global background upload UI
  emitUploadStatus(userId: string, payload: Record<string, unknown>) {
    void this.server.to(`user:${userId}`).emit('upload:status', payload);
  }
}

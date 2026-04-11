import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { DefaultEventsMap, Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

function extractCookieToken(cookieHeaderRaw: unknown): string | undefined {
  if (typeof cookieHeaderRaw !== 'string' || !cookieHeaderRaw.trim()) {
    return undefined;
  }

  const tokenCookie = cookieHeaderRaw
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('token='));

  if (!tokenCookie) return undefined;
  const token = tokenCookie.slice('token='.length);
  return token || undefined;
}

interface NotificationsSocketData {
  userId?: string;
}

type NotificationsSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  NotificationsSocketData
>;

type NotificationsServer = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  NotificationsSocketData
>;

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://www.soplantila.my.id',
      'https://soplantila.my.id',
    ],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: NotificationsServer;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, string> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: NotificationsSocket) {
    try {
      const authTokenRaw = client.handshake.auth?.token as unknown;
      const authHeaderRaw = client.handshake.headers.authorization as unknown;
      const cookieHeaderRaw = client.handshake.headers.cookie as unknown;

      const authToken =
        typeof authTokenRaw === 'string' ? authTokenRaw : undefined;

      const bearerToken =
        typeof authHeaderRaw === 'string'
          ? authHeaderRaw.split(' ')[1]
          : undefined;

      const cookieToken = extractCookieToken(cookieHeaderRaw);

      const token = authToken || bearerToken || cookieToken;

      if (!token || typeof token !== 'string') {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      const userId = payload.sub;

      this.userSockets.set(userId, client.id);
      client.data.userId = userId;

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

      void client.join(`user:${userId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown gateway error';
      this.logger.error('Connection error:', message);
      client.disconnect();
    }
  }

  handleDisconnect(client: NotificationsSocket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
    }
  }

  sendNotificationToUser(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.log(`Notification sent to user: ${userId}`);
  }

  // Send follow request notification
  sendFollowRequest(userId: string, data: unknown) {
    this.server.to(`user:${userId}`).emit('follow:request', data);
    this.logger.log(`Follow request sent to user: ${userId}`);
  }

  // Send follow accepted notification
  sendFollowAccepted(userId: string, data: unknown) {
    this.server.to(`user:${userId}`).emit('follow:accepted', data);
    this.logger.log(`Follow accepted sent to user: ${userId}`);
  }

  // Send follow rejected notification
  sendFollowRejected(userId: string, data: unknown) {
    this.server.to(`user:${userId}`).emit('follow:rejected', data);
    this.logger.log(`Follow rejected sent to user: ${userId}`);
  }

  broadcastNotification(notification: unknown) {
    this.server.emit('broadcast', notification);
  }

  @SubscribeMessage('markAsRead')
  handleMarkAsRead(
    @ConnectedSocket() client: NotificationsSocket,
    notificationId: string,
  ) {
    const userId = client.data.userId;
    this.logger.log(
      `User ${userId} marked notification ${notificationId} as read`,
    );
    client.emit('notificationRead', { notificationId });
  }
}

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { DefaultEventsMap, Server, Socket } from 'socket.io';

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

interface MessagesSocketData {
  userId?: string;
}

type MessagesSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  MessagesSocketData
>;

type MessagesServer = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  MessagesSocketData
>;

@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: MessagesServer;

  private readonly logger = new Logger(MessagesGateway.name);
  private readonly userRooms = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: MessagesSocket) {
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

      client.data.userId = userId;
      void client.join(`user:${userId}`);
      const rooms = this.userRooms.get(userId) ?? new Set<string>();
      rooms.add(client.id);
      this.userRooms.set(userId, rooms);

      this.logger.log(
        `Messages socket connected ${client.id} (user: ${userId})`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown gateway error';
      this.logger.error('Messages gateway connection error', message);
      client.disconnect();
    }
  }

  handleDisconnect(client: MessagesSocket) {
    const userId = client.data.userId;
    if (!userId) {
      return;
    }

    const rooms = this.userRooms.get(userId);
    if (rooms) {
      rooms.delete(client.id);
      if (rooms.size === 0) {
        this.userRooms.delete(userId);
      } else {
        this.userRooms.set(userId, rooms);
      }
    }

    this.logger.log(
      `Messages socket disconnected ${client.id} (user: ${userId})`,
    );
  }

  emitMessageToUser(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('message:new', payload);
  }
}

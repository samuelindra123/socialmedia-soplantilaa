import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FollowStatus,
  MessageStatus,
  NotificationType,
  Conversation,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { MessagesGateway } from './messages.gateway';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    private messagesGateway: MessagesGateway,
  ) {}

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                namaLengkap: true,
                profile: {
                  select: {
                    username: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p.userId !== userId,
      );
      const lastMessage = conv.messages[0] || null;

      // Count unread messages (messages from other user that are not READ)
      const unreadCount =
        lastMessage &&
        lastMessage.senderId !== userId &&
        lastMessage.status !== 'READ'
          ? 1
          : 0;

      return {
        id: conv.id,
        type: conv.type,
        updatedAt: conv.updatedAt,
        participant: otherParticipant
          ? {
              userId: otherParticipant.userId,
              namaLengkap: otherParticipant.user.namaLengkap,
              username: otherParticipant.user.profile?.username,
              profileImageUrl: otherParticipant.user.profile?.profileImageUrl,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.deletedForAll ? null : lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
              senderName: lastMessage.sender.namaLengkap,
              status: lastMessage.status,
              isDeleted: lastMessage.deletedForAll,
            }
          : null,
        unreadCount,
      };
    });
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        messages: {
          where: {
            senderId: { not: userId },
            status: { not: 'READ' },
            deletedForAll: false,
          },
        },
      },
    });

    return conversations.reduce(
      (total, conv) => total + conv.messages.length,
      0,
    );
  }

  async findOrCreateConversation(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException(
        'Tidak bisa membuat percakapan dengan diri sendiri',
      );
    }

    const isMutual = await this.isMutualFollow(userId, targetUserId);
    if (!isMutual) {
      throw new ForbiddenException(
        'Kamu harus saling mengikuti untuk mengirim pesan',
      );
    }

    let conversation = await this.findDirectConversation(userId, targetUserId);

    if (!conversation) {
      conversation = await this.createDirectConversation(userId, targetUserId);
    }

    const fullConversation = await this.prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                namaLengkap: true,
                profile: {
                  select: {
                    username: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const otherParticipant = fullConversation!.participants.find(
      (p) => p.userId !== userId,
    );

    return {
      id: fullConversation!.id,
      type: fullConversation!.type,
      participant: otherParticipant
        ? {
            userId: otherParticipant.userId,
            namaLengkap: otherParticipant.user.namaLengkap,
            username: otherParticipant.user.profile?.username,
            profileImageUrl: otherParticipant.user.profile?.profileImageUrl,
          }
        : null,
    };
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
    if (!dto.conversationId && !dto.recipientId) {
      throw new BadRequestException(
        'conversationId atau recipientId wajib diisi',
      );
    }

    const content = dto.content?.trim() || '';
    if (!content && !dto.mediaUrl) {
      throw new BadRequestException('Konten pesan atau media wajib diisi');
    }

    let conversationId = dto.conversationId ?? null;
    let recipientId: string;

    if (conversationId) {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true },
      });

      if (!conversation) {
        throw new NotFoundException('Percakapan tidak ditemukan');
      }

      if (!conversation.participants.some((p) => p.userId === senderId)) {
        throw new ForbiddenException('Tidak memiliki akses ke percakapan ini');
      }

      const recipient = conversation.participants.find(
        (p) => p.userId !== senderId,
      );

      if (!recipient) {
        throw new BadRequestException('Percakapan tidak valid');
      }

      recipientId = recipient.userId;
    } else {
      recipientId = dto.recipientId!;
      if (recipientId === senderId) {
        throw new BadRequestException(
          'Tidak bisa mengirim pesan ke diri sendiri',
        );
      }

      const isMutual = await this.isMutualFollow(senderId, recipientId);
      if (!isMutual) {
        throw new ForbiddenException(
          'Kamu harus saling mengikuti untuk mengirim pesan',
        );
      }

      const existing = await this.findDirectConversation(senderId, recipientId);
      if (existing) {
        conversationId = existing.id;
      } else {
        const conversation = await this.createDirectConversation(
          senderId,
          recipientId,
        );
        conversationId = conversation.id;
      }
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversationId,
        senderId,
        content,
        status: MessageStatus.SENT,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        fileName: dto.fileName,
      },
      include: {
        sender: {
          select: {
            id: true,
            namaLengkap: true,
            profile: {
              select: {
                username: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId: conversationId, userId: senderId },
      data: { lastReadAt: new Date() },
    });

    const notification = await this.prisma.notification.create({
      data: {
        userId: recipientId,
        actorId: senderId,
        type: NotificationType.MESSAGE,
        title: 'Pesan baru',
        message: content.slice(0, 120),
        actionUrl: `/chat/${conversationId}`,
      },
      include: {
        actor: {
          select: {
            id: true,
            namaLengkap: true,
            profile: {
              select: {
                username: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    this.notificationsGateway.sendNotificationToUser(recipientId, notification);

    this.messagesGateway.emitMessageToUser(recipientId, {
      conversationId,
      message,
    });

    this.messagesGateway.emitMessageToUser(senderId, {
      conversationId,
      message,
    });

    return {
      conversationId,
      message,
    };
  }

  async sendMessageWithMedia(
    senderId: string,
    dto: SendMessageDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File wajib diupload');
    }

    // Determine media type from file mimetype
    let mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' = 'DOCUMENT';
    if (file.mimetype.startsWith('image/')) {
      mediaType = 'IMAGE';
    } else if (file.mimetype.startsWith('video/')) {
      mediaType = 'VIDEO';
    } else if (file.mimetype.startsWith('audio/')) {
      mediaType = 'AUDIO';
    }

    // Upload to storage (simplified - in production use S3/cloud storage)
    const fs = await import('fs/promises');
    const path = await import('path');
    const crypto = await import('crypto');

    const uploadDir = path.join(process.cwd(), 'uploads', 'messages');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, file.buffer);

    const mediaUrl = `/uploads/messages/${filename}`;

    // Send message with media
    return this.sendMessage(senderId, {
      ...dto,
      mediaUrl,
      mediaType: mediaType as SendMessageDto['mediaType'],
      fileName: file.originalname,
    });
  }

  async getConversationMessages(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                namaLengkap: true,
                profile: {
                  select: {
                    username: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Percakapan tidak ditemukan');
    }

    if (!conversation.participants.some((p) => p.userId === userId)) {
      throw new ForbiddenException('Tidak memiliki akses ke percakapan ini');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            namaLengkap: true,
            profile: {
              select: {
                username: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    // Mark messages from other user as READ
    const readAt = new Date();
    const updatedMessages = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { in: [MessageStatus.SENT, MessageStatus.DELIVERED] },
      },
      data: { status: MessageStatus.READ, readAt },
    });

    // Update participant's lastReadAt
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: readAt },
    });

    // Notify sender that messages were read
    if (updatedMessages.count > 0) {
      const otherParticipant = conversation.participants.find(
        (p) => p.userId !== userId,
      );
      if (otherParticipant) {
        this.messagesGateway.emitMessageToUser(otherParticipant.userId, {
          type: 'messages:read',
          conversationId,
          readBy: userId,
          readAt,
        });
      }
    }

    // Process messages for response (handle deleted messages)
    const processedMessages = messages.map((msg) => ({
      ...msg,
      content: msg.deletedForAll ? null : msg.content,
      mediaUrl: msg.deletedForAll ? null : msg.mediaUrl,
      isDeleted: msg.deletedForAll,
    }));

    return {
      conversation: {
        id: conversation.id,
        participants: conversation.participants.map((p) => ({
          userId: p.userId,
          namaLengkap: p.user.namaLengkap,
          username: p.user.profile?.username,
          profileImageUrl: p.user.profile?.profileImageUrl,
        })),
      },
      messages: processedMessages,
    };
  }

  async markAsDelivered(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });

    if (!message) {
      throw new NotFoundException('Pesan tidak ditemukan');
    }

    // Only recipient can mark as delivered
    if (message.senderId === userId) {
      return message;
    }

    if (!message.conversation.participants.some((p) => p.userId === userId)) {
      throw new ForbiddenException('Tidak memiliki akses');
    }

    if (message.status === MessageStatus.SENT) {
      const updated = await this.prisma.message.update({
        where: { id: messageId },
        data: { status: MessageStatus.DELIVERED },
      });

      // Notify sender
      this.messagesGateway.emitMessageToUser(message.senderId, {
        type: 'message:delivered',
        messageId,
        conversationId: message.conversationId,
      });

      return updated;
    }

    return message;
  }

  async deleteMessage(
    messageId: string,
    userId: string,
    deleteForAll: boolean,
  ) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });

    if (!message) {
      throw new NotFoundException('Pesan tidak ditemukan');
    }

    // Only sender can delete
    if (message.senderId !== userId) {
      throw new ForbiddenException('Hanya pengirim yang bisa menghapus pesan');
    }

    if (deleteForAll) {
      // Delete for everyone
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          deletedForAll: true,
          content: null,
          mediaUrl: null,
        },
      });

      // Notify other participants
      const otherParticipant = message.conversation.participants.find(
        (p) => p.userId !== userId,
      );
      if (otherParticipant) {
        this.messagesGateway.emitMessageToUser(otherParticipant.userId, {
          type: 'message:deleted',
          messageId,
          conversationId: message.conversationId,
          deleteForAll: true,
        });
      }
    } else {
      // Delete only for sender (mark as deleted)
      await this.prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true },
      });
    }

    return { success: true, deleteForAll };
  }

  private async findDirectConversation(
    userA: string,
    userB: string,
  ): Promise<Conversation | null> {
    return this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          {
            participants: {
              some: { userId: userA },
            },
          },
          {
            participants: {
              some: { userId: userB },
            },
          },
        ],
      },
    });
  }

  private async createDirectConversation(userA: string, userB: string) {
    return this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          createMany: {
            data: [{ userId: userA }, { userId: userB }],
          },
        },
      },
    });
  }

  private async isMutualFollow(userA: string, userB: string) {
    const [aToB, bToA] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: userA, followingId: userB },
        },
      }),
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: userB, followingId: userA },
        },
      }),
    ]);

    return (
      aToB?.status === FollowStatus.ACCEPTED &&
      bToA?.status === FollowStatus.ACCEPTED
    );
  }
}

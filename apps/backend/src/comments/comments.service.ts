import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    if (dto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentComment || parentComment.postId !== postId) {
        throw new NotFoundException('Parent comment tidak valid');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        userId,
        postId,
        parentId: dto.parentId,
      },
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
    });

    // Emit realtime new comment event
    this.eventsGateway.emitNewComment(postId, {
      ...comment,
      _count: { likes: 0 },
      isLiked: false,
    });

    if (post.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          actorId: userId,
          type: 'COMMENT',
          title: 'Komentar Baru',
          message: 'mengomentari post Anda',
          actionUrl: `/posts/${postId}`,
        },
      });

      // Emit notification
      this.eventsGateway.emitNotification(post.authorId, {
        type: 'COMMENT',
        message: 'mengomentari post Anda',
        postId,
      });
    }

    return comment;
  }

  async getPostComments(
    postId: string,
    page: number = 1,
    limit: number = 20,
    currentUserId?: string,
  ) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          likes: currentUserId
            ? { where: { userId: currentUserId }, select: { userId: true } }
            : undefined,
          replies: {
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
              likes: currentUserId
                ? { where: { userId: currentUserId }, select: { userId: true } }
                : undefined,
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { replies: true, likes: true },
          },
        },
      }),
      this.prisma.comment.count({ where: { postId, parentId: null } }),
    ]);

    return {
      data: comments.map((c) => ({
        ...c,
        isLiked: currentUserId ? !!(c.likes && c.likes.length > 0) : false,
        replies: (c.replies || []).map((r) => ({
          ...r,
          isLiked: currentUserId ? !!(r.likes && r.likes.length > 0) : false,
        })),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCommentReplies(commentId: string, currentUserId?: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment tidak ditemukan');
    }

    const replies = await this.prisma.comment.findMany({
      where: {
        parentId: commentId,
      },
      orderBy: { createdAt: 'asc' },
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
        likes: currentUserId
          ? { where: { userId: currentUserId }, select: { userId: true } }
          : undefined,
        _count: {
          select: { likes: true },
        },
      },
    });

    return {
      data: replies.map((r) => ({
        ...r,
        isLiked: currentUserId ? !!(r.likes && r.likes.length > 0) : false,
      })),
    };
  }

  async updateComment(
    userId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment tidak ditemukan');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Tidak punya akses untuk edit comment ini');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
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
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment tidak ditemukan');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'Tidak punya akses untuk delete comment ini',
      );
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // Emit realtime comment deleted event
    this.eventsGateway.emitCommentDeleted(comment.postId, commentId);

    return { message: 'Comment berhasil dihapus' };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class LikesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async likePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { author: true, _count: { select: { likes: true } } },
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      return { message: 'Post berhasil dilike' };
    }

    await this.prisma.like.create({
      data: { userId, postId },
    });

    // Get updated like count
    const updatedPost = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { _count: { select: { likes: true } } },
    });

    // Emit realtime like update
    this.eventsGateway.emitLikeUpdate(
      postId,
      updatedPost?._count.likes || post._count.likes + 1,
      userId,
      true,
    );

    if (post.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          actorId: userId,
          type: 'LIKE',
          title: 'Post Disukai',
          message: 'menyukai post Anda',
          actionUrl: `/posts/${postId}`,
        },
      });

      // Emit notification to post author
      this.eventsGateway.emitNotification(post.authorId, {
        type: 'LIKE',
        message: 'menyukai post Anda',
        postId,
      });
    }

    return { message: 'Post berhasil dilike' };
  }

  async unlikePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { _count: { select: { likes: true } } },
    });

    const like = await this.prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (!like) {
      return { message: 'Unlike berhasil' };
    }

    await this.prisma.like.delete({
      where: { id: like.id },
    });

    // Get updated like count
    const updatedPost = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { _count: { select: { likes: true } } },
    });

    // Emit realtime like update
    this.eventsGateway.emitLikeUpdate(
      postId,
      updatedPost?._count.likes || (post?._count.likes || 1) - 1,
      userId,
      false,
    );

    return { message: 'Unlike berhasil' };
  }

  async getPostLikes(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { postId },
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
        },
      }),
      this.prisma.like.count({ where: { postId } }),
    ]);

    return {
      data: likes.map((like) => ({
        user: {
          id: like.user.id,
          username: like.user.profile?.username,
          namaLengkap: like.user.namaLengkap,
          profileImageUrl: like.user.profile?.profileImageUrl,
        },
        likedAt: like.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async checkLikeStatus(userId: string, postId: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    return { isLiked: !!like };
  }
}

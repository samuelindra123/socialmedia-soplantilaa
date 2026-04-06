import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class CommentsLikesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async like(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true },
    });
    if (!comment) throw new NotFoundException('Comment tidak ditemukan');
    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    if (existing) return { message: 'Sudah di-like' };
    await this.prisma.commentLike.create({ data: { userId, commentId } });

    // Get updated like count
    const likesCount = await this.prisma.commentLike.count({
      where: { commentId },
    });

    // Emit realtime comment like update
    this.eventsGateway.emitCommentLikeUpdate(
      comment.postId,
      commentId,
      likesCount,
      userId,
      true,
    );

    return { message: 'Like comment berhasil' };
  }

  async unlike(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true },
    });
    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    if (!existing) return { message: 'Sudah unlike' };
    await this.prisma.commentLike.delete({ where: { id: existing.id } });

    // Get updated like count
    const likesCount = await this.prisma.commentLike.count({
      where: { commentId },
    });

    // Emit realtime comment like update
    if (comment) {
      this.eventsGateway.emitCommentLikeUpdate(
        comment.postId,
        commentId,
        likesCount,
        userId,
        false,
      );
    }

    return { message: 'Unlike comment berhasil' };
  }
}

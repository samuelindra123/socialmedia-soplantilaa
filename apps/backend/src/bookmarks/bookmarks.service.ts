import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async bookmarkPost(userId: string, postId: string) {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Check if already bookmarked
    const existing = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existing) {
      throw new ConflictException('Post sudah di-bookmark');
    }

    await this.prisma.bookmark.create({
      data: { userId, postId },
    });

    return { message: 'Post berhasil di-bookmark' };
  }

  async unbookmarkPost(userId: string, postId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark tidak ditemukan');
    }

    await this.prisma.bookmark.delete({
      where: { id: bookmark.id },
    });

    return { message: 'Bookmark dihapus' };
  }

  async getMyBookmarks(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: {
              author: {
                include: {
                  profile: {
                    select: {
                      username: true,
                      profileImageUrl: true,
                    },
                  },
                },
              },
              images: true,
              _count: {
                select: {
                  bookmarks: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.bookmark.count({ where: { userId } }),
    ]);

    return {
      data: bookmarks.map((b) => ({
        bookmarkId: b.id,
        bookmarkedAt: b.createdAt,
        post: {
          id: b.post.id,
          content: b.post.content,
          images: b.post.images,
          author: {
            username: b.post.author.profile?.username,
            namaLengkap: b.post.author.namaLengkap,
            profileImageUrl: b.post.author.profile?.profileImageUrl,
          },
          bookmarkCount: b.post._count.bookmarks,
          createdAt: b.post.createdAt,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async checkBookmarkStatus(userId: string, postId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    return { isBookmarked: !!bookmark };
  }
}

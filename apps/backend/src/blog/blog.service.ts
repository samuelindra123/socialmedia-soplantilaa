import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlogPostStatus } from '@prisma/client';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicPosts() {
    const now = new Date();
    return this.prisma.blogPost.findMany({
      where: {
        OR: [
          { status: BlogPostStatus.PUBLISHED },
          {
            status: BlogPostStatus.SCHEDULED,
            publishedAt: { lte: now },
          },
        ],
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getPublicPostBySlug(slug: string) {
    return this.prisma.blogPost.findFirst({
      where: {
        slug,
      },
    });
  }
}

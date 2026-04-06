import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private prisma: PrismaService) {}

  @Get('global')
  async getGlobal(
    @GetUser('id') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const p = parseInt(page);
    const l = parseInt(limit);
    const skip = (p - 1) * l;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: l,
        include: {
          author: {
            select: {
              id: true,
              namaLengkap: true,
              profile: { select: { username: true, profileImageUrl: true } },
            },
          },
          images: { select: { id: true, url: true } },
          _count: { select: { likes: true, comments: true, bookmarks: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count(),
    ]);

    return {
      data: posts,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    };
  }
}

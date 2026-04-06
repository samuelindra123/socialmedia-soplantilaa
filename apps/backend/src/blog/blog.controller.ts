import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { BlogService } from './blog.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @Public()
  async list() {
    return this.blogService.listPublicPosts();
  }

  @Get(':slug')
  @Public()
  async getBySlug(@Param('slug') slug: string) {
    const post = await this.blogService.getPublicPostBySlug(slug);
    if (!post) {
      throw new NotFoundException('Blog post tidak ditemukan');
    }
    return post;
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  CreatePostFromUrlsDto,
  GetPostPresignedUrlsDto,
} from './dto/post-media-upload.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  createPost(
    @GetUser('id') userId: string,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.postsService.createPost(userId, dto, files);
  }

  // Text-only creation
  @Post('text')
  createTextPost(@GetUser('id') userId: string, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(
      userId,
      { ...dto, type: 'text', mediaType: undefined },
      [],
    );
  }

  // Image post creation (multiple images allowed). FormData key: images
  @Post('images')
  @UseInterceptors(FilesInterceptor('images', 10))
  createImagePost(
    @GetUser('id') userId: string,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.postsService.createPost(
      userId,
      { ...dto, type: 'image', mediaType: 'image' },
      files,
    );
  }

  @Post('presigned-urls')
  getPostPresignedUrls(@Body() dto: GetPostPresignedUrlsDto) {
    return this.postsService.getPresignedUrls(dto);
  }

  @Post('from-urls')
  createPostFromUrls(
    @GetUser('id') userId: string,
    @Body() dto: CreatePostFromUrlsDto,
  ) {
    return this.postsService.createPostFromUrls(userId, dto);
  }

  // Video post creation (single video). FormData key: video
  @Post('video')
  @UseInterceptors(FileInterceptor('video'))
  async createVideoPost(
    @GetUser('id') userId: string,
    @Body() dto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Buat post dengan konten normatif (fallback jika kosong)
    const normDto: CreatePostDto = {
      title: dto.title,
      content: dto.content ?? dto.title ?? '-',
      type: 'video',
      mediaType: 'video',
      tags: dto.tags,
    };
    const post = await this.postsService.createPost(userId, normDto, []);
    // Lalu unggah video ke PostVideo
    await this.postsService.uploadPostVideo(
      userId,
      post.id,
      file as Express.Multer.File,
    );
    return this.postsService.getPostById(post.id);
  }

  @Post(':postId/videos')
  @UseInterceptors(FileInterceptor('video'))
  uploadPostVideo(
    @Param('postId') postId: string,
    @GetUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.postsService.uploadPostVideo(userId, postId, file);
  }

  // Fallback endpoint to support form-data with key `file` and explicit postId
  @Post('videos')
  @UseInterceptors(FileInterceptor('file'))
  uploadPostVideoDirect(
    @Body('postId') postId: string,
    @GetUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.postsService.uploadPostVideo(userId, postId, file);
  }

  @Get('feed')
  getFeed(@GetUser('id') userId: string, @Query() dto: GetFeedDto) {
    return this.postsService.getFeed({ ...dto, currentUserId: userId });
  }

  @Get('user/:userId')
  getUserPosts(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.postsService.getUserPosts(userId, page, limit);
  }

  @Get(':postId')
  @Public()
  getPostById(@Param('postId') postId: string) {
    return this.postsService.getPostById(postId);
  }

  @Get(':postId/likes')
  getPostLikes(@Param('postId') postId: string) {
    return this.postsService.getPostLikes(postId);
  }

  @Put(':postId')
  updatePost(
    @Param('postId') postId: string,
    @GetUser('id') userId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(postId, userId, dto);
  }

  @Delete(':postId')
  deletePost(@Param('postId') postId: string, @GetUser('id') userId: string) {
    return this.postsService.deletePost(postId, userId);
  }
}

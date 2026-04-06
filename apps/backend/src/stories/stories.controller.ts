import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { StoriesService } from './stories.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  CreateStoryDto,
  GetPresignedUrlsDto,
  CreateStoriesFromUrlsDto,
} from './dto/create-story.dto';
import { CreateMultipleStoryDto } from './dto/create-multiple-story.dto';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  // Get presigned URLs for direct upload
  @Post('presigned-urls')
  getPresignedUrls(
    @GetUser('id') userId: string,
    @Body() dto: GetPresignedUrlsDto,
  ) {
    return this.storiesService.getPresignedUrls(dto);
  }

  // Create stories from already-uploaded URLs
  @Post('from-urls')
  createStoriesFromUrls(
    @GetUser('id') userId: string,
    @Body() dto: CreateStoriesFromUrlsDto,
  ) {
    return this.storiesService.createStoriesFromUrls(userId, dto);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  createStory(
    @GetUser('id') userId: string,
    @Body() dto: CreateStoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storiesService.createStory(userId, dto, file);
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  createMultipleStories(
    @GetUser('id') userId: string,
    @Body() dto: CreateMultipleStoryDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.storiesService.createMultipleStories(userId, dto, files);
  }

  @Get('feed')
  getStoriesFeed(@GetUser('id') userId: string) {
    return this.storiesService.getStoriesFeed(userId);
  }

  @Post(':id/view')
  viewStory(@GetUser('id') userId: string, @Param('id') storyId: string) {
    return this.storiesService.viewStory(userId, storyId);
  }

  @Delete(':id')
  deleteStory(@GetUser('id') userId: string, @Param('id') storyId: string) {
    return this.storiesService.deleteStory(userId, storyId);
  }
}

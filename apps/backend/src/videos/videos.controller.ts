import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { VideosService } from './videos.service';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 200 * 1024 * 1024 },
      },
    ),
  )
  async uploadVideo(
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @Body() body: { width?: string; height?: string; duration?: string },
    @Request() req: any,
  ) {
    if (!files?.video?.[0]) throw new BadRequestException('File video wajib ada');
    return this.videosService.uploadVideo(
      files.video[0],
      files.thumbnail?.[0],
      req.user.id,
      {
        width: body.width ? parseInt(body.width) : undefined,
        height: body.height ? parseInt(body.height) : undefined,
        duration: body.duration ? parseInt(body.duration) : undefined,
      },
    );
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string, @Request() req: any) {
    return this.videosService.getVideoStatus(id, req.user.id);
  }

  @Get(':id')
  async getVideo(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.videosService.getVideo(userId, id);
  }

  @Delete(':id')
  async deleteVideo(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.videosService.deleteVideo(userId, id);
  }
}

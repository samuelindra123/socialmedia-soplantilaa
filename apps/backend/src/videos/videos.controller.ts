import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Put,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { VideosService } from './videos.service';
import { UploadVideoDto } from './dto/upload-video.dto';
import { ListVideosDto } from './dto/list-videos.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { VideoResponseDto } from './dto/video-response.dto';
import {
  CompleteResumableUploadDto,
  CreateResumableUploadSessionDto,
} from './dto/resumable-video.dto';
import { ResumableVideoUploadService } from './resumable-video-upload.service';

@Controller('videos')
@ApiTags('Videos')
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly resumableUploadService: ResumableVideoUploadService,
  ) {}

  @Post('resumable/sessions')
  @ApiOperation({ summary: 'Membuat session resumable upload untuk video.' })
  createResumableSession(
    @GetUser('id') userId: string,
    @Body() dto: CreateResumableUploadSessionDto,
  ) {
    return this.resumableUploadService.createSession(userId, dto);
  }

  @Put('resumable/sessions/:sessionId/chunks/:chunkIndex')
  @UseInterceptors(FileInterceptor('chunk'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Unggah atau retry satu chunk video.' })
  uploadResumableChunk(
    @GetUser('id') userId: string,
    @Param('sessionId') sessionId: string,
    @Param('chunkIndex', ParseIntPipe) chunkIndex: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.resumableUploadService.uploadChunk(
      userId,
      sessionId,
      chunkIndex,
      file,
    );
  }

  @Get('resumable/sessions/:sessionId')
  @ApiOperation({ summary: 'Cek status session resumable upload.' })
  getResumableSessionStatus(
    @GetUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.resumableUploadService.getSessionStatus(userId, sessionId);
  }

  @Post('resumable/sessions/:sessionId/complete')
  @ApiOperation({
    summary:
      'Selesaikan upload chunk, gabungkan file, lalu publikasikan video.',
  })
  completeResumableSession(
    @GetUser('id') userId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: CompleteResumableUploadDto,
  ) {
    return this.resumableUploadService.completeSession(userId, sessionId, dto);
  }

  @Delete('resumable/sessions/:sessionId')
  @ApiOperation({ summary: 'Batalkan session resumable upload.' })
  cancelResumableSession(
    @GetUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.resumableUploadService.cancelSession(userId, sessionId);
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('videos', 5))
  @ApiOperation({
    summary: 'Unggah video dan jalankan proses kompresi di background.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        videos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Job pemrosesan dimasukkan ke antrean.' })
  async uploadVideos(
    @GetUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadVideoDto,
  ) {
    return this.videosService.enqueueUploads(userId, files, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mengambil detail video milik pengguna.' })
  @ApiOkResponse({ type: VideoResponseDto })
  async getVideo(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.videosService.getVideo(userId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar video dengan pagination.' })
  @ApiOkResponse({ description: 'Daftar video berhasil diambil.' })
  async listVideos(
    @GetUser('id') userId: string,
    @Query() query: ListVideosDto,
  ) {
    return this.videosService.listVideos(userId, query);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete video dan hapus aset di storage.' })
  @ApiOkResponse({ description: 'Video berhasil ditandai sebagai terhapus.' })
  async deleteVideo(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.videosService.deleteVideo(userId, id);
  }
}

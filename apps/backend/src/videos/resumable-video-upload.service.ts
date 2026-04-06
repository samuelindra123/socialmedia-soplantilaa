import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  promises as fsPromises,
} from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { VideosService } from './videos.service';
import { EventsGateway } from '../events/events.gateway';
import {
  CompleteResumableUploadDto,
  CreateResumableUploadSessionDto,
  MAX_VIDEO_UPLOAD_BYTES,
} from './dto/resumable-video.dto';
import { UploadVideoDto } from './dto/upload-video.dto';

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_RETRY_CHUNK_BYTES = MAX_VIDEO_UPLOAD_BYTES;

interface ResumableUploadSession {
  sessionId: string;
  taskId: string;
  userId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  totalChunks: number;
  chunkSize: number;
  title?: string;
  description?: string;
  tags: string[];
  chunkDir: string;
  uploadedChunks: Set<number>;
  chunkSizes: Map<number, number>;
  createdAt: number;
  updatedAt: number;
  status: 'created' | 'uploading' | 'processing' | 'completed' | 'failed';
}

@Injectable()
export class ResumableVideoUploadService {
  private readonly sessions = new Map<string, ResumableUploadSession>();

  constructor(
    private readonly videosService: VideosService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async createSession(userId: string, dto: CreateResumableUploadSessionDto) {
    await this.pruneExpiredSessions();

    if (dto.fileSize > MAX_VIDEO_UPLOAD_BYTES) {
      throw new BadRequestException('Ukuran video maksimal 100MB.');
    }

    if (!dto.mimeType.startsWith('video/')) {
      throw new BadRequestException('File harus berupa video.');
    }

    if (dto.totalChunks <= 0) {
      throw new BadRequestException('totalChunks harus lebih dari 0.');
    }

    const sessionId = randomUUID();
    const taskId = dto.clientTaskId || sessionId;
    const chunkSize = dto.chunkSize || DEFAULT_CHUNK_SIZE;
    const safeName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    const chunkDir = join(
      process.cwd(),
      'tmp',
      'uploads',
      'videos',
      'resumable',
      userId,
      sessionId,
      'chunks',
    );

    await fsPromises.mkdir(chunkDir, { recursive: true });

    const session: ResumableUploadSession = {
      sessionId,
      taskId,
      userId,
      fileName: safeName,
      mimeType: dto.mimeType,
      fileSize: dto.fileSize,
      totalChunks: dto.totalChunks,
      chunkSize,
      title: dto.title,
      description: dto.description,
      tags: dto.tags || [],
      chunkDir,
      uploadedChunks: new Set<number>(),
      chunkSizes: new Map<number, number>(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'created',
    };

    this.sessions.set(sessionId, session);
    this.emitStatus(session, {
      message: 'Session upload video dibuat.',
      progress: 0,
    });

    return {
      sessionId,
      taskId,
      fileName: session.fileName,
      fileSize: session.fileSize,
      totalChunks: session.totalChunks,
      uploadedChunks: [],
      uploadedBytes: 0,
      progress: 0,
      recommendedChunkSize: DEFAULT_CHUNK_SIZE,
      maxUploadBytes: MAX_VIDEO_UPLOAD_BYTES,
    };
  }

  async uploadChunk(
    userId: string,
    sessionId: string,
    chunkIndex: number,
    file: Express.Multer.File,
  ) {
    const session = this.getSessionOrThrow(sessionId, userId);

    if (!file) {
      throw new BadRequestException('Chunk tidak ditemukan pada request.');
    }

    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      throw new BadRequestException('chunkIndex tidak valid.');
    }

    if (chunkIndex >= session.totalChunks) {
      throw new BadRequestException('chunkIndex melebihi totalChunks.');
    }

    if (file.size <= 0 || file.size > MAX_RETRY_CHUNK_BYTES) {
      throw new BadRequestException('Ukuran chunk tidak valid.');
    }

    const chunkPath = join(session.chunkDir, `${chunkIndex}.part`);
    await fsPromises.mkdir(session.chunkDir, { recursive: true });

    if (file.path && existsSync(file.path)) {
      await fsPromises.rename(file.path, chunkPath);
    } else if (file.buffer && file.buffer.length > 0) {
      await fsPromises.writeFile(chunkPath, file.buffer);
    } else {
      throw new BadRequestException('Data chunk tidak tersedia.');
    }

    const previousSize = session.chunkSizes.get(chunkIndex) || 0;
    const nextTotalBytes =
      this.getUploadedBytes(session) - previousSize + Number(file.size);

    if (nextTotalBytes > MAX_VIDEO_UPLOAD_BYTES || nextTotalBytes > session.fileSize) {
      throw new BadRequestException('Total upload melebihi batas maksimal 100MB.');
    }

    session.chunkSizes.set(chunkIndex, Number(file.size));
    session.uploadedChunks.add(chunkIndex);
    session.updatedAt = Date.now();
    session.status = 'uploading';

    const uploadedCount = session.uploadedChunks.size;
    const progress = Math.min(
      99,
      Math.round((uploadedCount / session.totalChunks) * 100),
    );

    this.emitStatus(session, {
      message: 'Chunk berhasil diterima.',
      progress,
      uploadedChunks: uploadedCount,
      totalChunks: session.totalChunks,
      uploadedBytes: this.getUploadedBytes(session),
    });

    return {
      sessionId: session.sessionId,
      taskId: session.taskId,
      chunkIndex,
      uploadedChunks: uploadedCount,
      totalChunks: session.totalChunks,
      uploadedBytes: this.getUploadedBytes(session),
      progress,
      status: session.status,
    };
  }

  async getSessionStatus(userId: string, sessionId: string) {
    const session = this.getSessionOrThrow(sessionId, userId);
    const uploaded = Array.from(session.uploadedChunks).sort((a, b) => a - b);

    return {
      sessionId: session.sessionId,
      taskId: session.taskId,
      status: session.status,
      fileName: session.fileName,
      fileSize: session.fileSize,
      totalChunks: session.totalChunks,
      uploadedChunks: uploaded,
      uploadedBytes: this.getUploadedBytes(session),
      progress: Math.round((uploaded.length / session.totalChunks) * 100),
      createdAt: new Date(session.createdAt).toISOString(),
      updatedAt: new Date(session.updatedAt).toISOString(),
    };
  }

  async completeSession(
    userId: string,
    sessionId: string,
    dto: CompleteResumableUploadDto,
  ) {
    const session = this.getSessionOrThrow(sessionId, userId);
    const missingChunks: number[] = [];

    for (let index = 0; index < session.totalChunks; index += 1) {
      if (!session.uploadedChunks.has(index)) {
        missingChunks.push(index);
      }
    }

    if (missingChunks.length > 0) {
      throw new BadRequestException({
        message: 'Masih ada chunk yang belum terunggah.',
        missingChunks,
      });
    }

    session.status = 'processing';
    session.updatedAt = Date.now();

    this.emitStatus(session, {
      message: 'Semua chunk selesai. Menggabungkan video...',
      progress: 99,
      uploadedChunks: session.totalChunks,
      totalChunks: session.totalChunks,
      uploadedBytes: this.getUploadedBytes(session),
    });

    const ext = extname(session.fileName) || '.mp4';
    const assembledPath = join(
      process.cwd(),
      'tmp',
      'uploads',
      'videos',
      `${Date.now()}-${session.sessionId}${ext}`,
    );

    await this.assembleChunks(session, assembledPath);

    const assembledStats = await fsPromises.stat(assembledPath);
    if (assembledStats.size > MAX_VIDEO_UPLOAD_BYTES) {
      throw new BadRequestException('Ukuran video maksimal 100MB.');
    }

    const uploadDto: UploadVideoDto = {
      title: dto.title ?? session.title,
      description: dto.description ?? session.description,
      tags: dto.tags ?? session.tags,
    };

    const assembledFile = {
      fieldname: 'videos',
      originalname: session.fileName,
      encoding: '7bit',
      mimetype: session.mimeType,
      size: assembledStats.size,
      destination: join(process.cwd(), 'tmp', 'uploads', 'videos'),
      filename: `${Date.now()}-${session.sessionId}${ext}`,
      path: assembledPath,
      buffer: Buffer.alloc(0),
      stream: createReadStream(assembledPath),
    } as unknown as Express.Multer.File;

    try {
      const result = await this.videosService.enqueueUploads(
        userId,
        [assembledFile],
        uploadDto,
      );

      session.status = 'completed';
      session.updatedAt = Date.now();

      await fsPromises.rm(join(session.chunkDir, '..'), {
        recursive: true,
        force: true,
      });

      this.emitStatus(session, {
        message:
          'Upload selesai. Video sudah bisa diputar, optimasi kualitas berjalan di background.',
        progress: 100,
        uploadedChunks: session.totalChunks,
        totalChunks: session.totalChunks,
        uploadedBytes: assembledStats.size,
      });

      return {
        ...result,
        sessionId: session.sessionId,
        taskId: session.taskId,
        status: session.status,
      };
    } catch (error) {
      session.status = 'failed';
      session.updatedAt = Date.now();

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.emitStatus(session, {
        message: 'Upload gagal diselesaikan.',
        progress: 0,
        error: message,
      });
      throw error;
    }
  }

  async cancelSession(userId: string, sessionId: string) {
    const session = this.getSessionOrThrow(sessionId, userId);
    this.sessions.delete(session.sessionId);
    await fsPromises.rm(join(session.chunkDir, '..'), {
      recursive: true,
      force: true,
    });

    this.eventsGateway.emitUploadStatus(userId, {
      taskId: session.taskId,
      sessionId: session.sessionId,
      status: 'failed',
      progress: 0,
      message: 'Upload dibatalkan.',
      timestamp: new Date().toISOString(),
    });

    return { message: 'Session upload dibatalkan.' };
  }

  private getSessionOrThrow(sessionId: string, userId: string) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException('Session upload tidak ditemukan.');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Tidak punya akses untuk session ini.');
    }

    return session;
  }

  private getUploadedBytes(session: ResumableUploadSession) {
    return Array.from(session.chunkSizes.values()).reduce(
      (sum, size) => sum + size,
      0,
    );
  }

  private async assembleChunks(
    session: ResumableUploadSession,
    assembledPath: string,
  ) {
    await fsPromises.mkdir(join(process.cwd(), 'tmp', 'uploads', 'videos'), {
      recursive: true,
    });

    const writeStream = createWriteStream(assembledPath);

    for (let index = 0; index < session.totalChunks; index += 1) {
      const chunkPath = join(session.chunkDir, `${index}.part`);
      await new Promise<void>((resolve, reject) => {
        const stream = createReadStream(chunkPath);
        stream.on('error', reject);
        stream.on('end', resolve);
        stream.pipe(writeStream, { end: false });
      });
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.on('error', reject);
      writeStream.end(() => resolve());
    });
  }

  private emitStatus(
    session: ResumableUploadSession,
    extras: {
      message: string;
      progress: number;
      uploadedChunks?: number;
      totalChunks?: number;
      uploadedBytes?: number;
      error?: string;
    },
  ) {
    this.eventsGateway.emitUploadStatus(session.userId, {
      taskId: session.taskId,
      sessionId: session.sessionId,
      status: session.status,
      mediaType: 'video',
      fileName: session.fileName,
      fileSize: session.fileSize,
      progress: extras.progress,
      uploadedChunks: extras.uploadedChunks,
      totalChunks: extras.totalChunks,
      uploadedBytes: extras.uploadedBytes,
      message: extras.message,
      error: extras.error,
      timestamp: new Date().toISOString(),
    });
  }

  private async pruneExpiredSessions() {
    const now = Date.now();
    const expired: ResumableUploadSession[] = [];

    for (const session of this.sessions.values()) {
      if (now - session.updatedAt > SESSION_TTL_MS) {
        expired.push(session);
      }
    }

    if (expired.length === 0) {
      return;
    }

    await Promise.all(
      expired.map(async (session) => {
        this.sessions.delete(session.sessionId);
        await fsPromises.rm(join(session.chunkDir, '..'), {
          recursive: true,
          force: true,
        });
      }),
    );
  }
}

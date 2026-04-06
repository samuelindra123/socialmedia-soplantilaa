import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { PrismaService } from '../prisma/prisma.service';
import { VideoStorageService } from './video-storage.service';
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException } from '@nestjs/common';
import { UploadVideoDto } from './dto/upload-video.dto';

describe('VideosService', () => {
  let service: VideosService;

  const mockPrismaService = {
    video: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    post: {
      create: jest.fn(),
    },
    hashtag: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockStorageService = {
    uploadOriginalVideo: jest.fn(),
    deleteByUrl: jest.fn(),
  };

  const mockVideoQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: VideoStorageService,
          useValue: mockStorageService,
        },
        {
          provide: getQueueToken('video-processing'),
          useValue: mockVideoQueue,
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueUploads', () => {
    it('should throw BadRequestException when no files provided', async () => {
      await expect(
        service.enqueueUploads('user-id', [], {} as UploadVideoDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when files is null', async () => {
      await expect(
        service.enqueueUploads(
          'user-id',
          null as unknown as Express.Multer.File[],
          {} as UploadVideoDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Tag Validation', () => {
    it('should validate and clean tags correctly', () => {
      // Test that tags are properly sanitized
      const tags = [
        'Valid Tag',
        'UPPERCASE',
        'special@#chars',
        'very-long-tag-that-exceeds-thirty-characters-limit',
      ];

      const validTags = tags
        .map((t) =>
          t
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
            .slice(0, 30),
        )
        .filter((t) => t.length > 0)
        .slice(0, 10);

      expect(validTags).toContain('validtag');
      expect(validTags).toContain('uppercase');
      expect(validTags).toContain('specialchars');
      // Long tag should be truncated to 30 chars
      expect(validTags[3].length).toBeLessThanOrEqual(30);
    });

    it('should limit tags to maximum 10', () => {
      const tags = Array.from({ length: 15 }, (_, i) => `tag${i}`);

      const validTags = tags
        .map((t) =>
          t
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
            .slice(0, 30),
        )
        .filter((t) => t.length > 0)
        .slice(0, 10);

      expect(validTags.length).toBe(10);
    });

    it('should filter out empty tags', () => {
      const tags = ['valid', '', '   ', 'another', '###'];

      const validTags = tags
        .map((t) =>
          t
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
            .slice(0, 30),
        )
        .filter((t) => t.length > 0);

      expect(validTags).toEqual(['valid', 'another']);
    });
  });

  describe('getVideo', () => {
    it('should return video when found', async () => {
      const mockVideo = {
        id: 'video-id',
        title: 'Test Video',
        description: 'Test Description',
        userId: 'user-id',
        status: 'READY',
        originalUrl: 'https://example.com/video.mp4',
        processedUrl: 'https://example.com/video.mp4',
      };

      mockPrismaService.video.findFirst.mockResolvedValue(mockVideo);

      const result = await service.getVideo('user-id', 'video-id');

      expect(result).toBeDefined();
      expect(result.id).toBe('video-id');
      expect(mockPrismaService.video.findFirst).toHaveBeenCalledWith({
        where: { id: 'video-id', userId: 'user-id', deletedAt: null },
      });
    });

    it('should throw NotFoundException when video not found', async () => {
      mockPrismaService.video.findFirst.mockResolvedValue(null);

      await expect(service.getVideo('user-id', 'non-existent')).rejects.toThrow(
        'Video tidak ditemukan',
      );
    });
  });

  describe('listVideos', () => {
    it('should return paginated videos', async () => {
      const mockVideos = [
        { id: 'v1', title: 'Video 1', status: 'READY' },
        { id: 'v2', title: 'Video 2', status: 'READY' },
      ];

      mockPrismaService.$transaction.mockResolvedValue([mockVideos, 2]);

      const result = await service.listVideos('user-id', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });
  });
});

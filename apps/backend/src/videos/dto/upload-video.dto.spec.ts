import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UploadVideoDto } from './upload-video.dto';

describe('UploadVideoDto', () => {
  describe('title validation', () => {
    it('should pass with valid title', async () => {
      const dto = plainToInstance(UploadVideoDto, {
        title: 'My Video Title',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with empty title (optional field)', async () => {
      const dto = plainToInstance(UploadVideoDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with title exceeding 120 characters', async () => {
      const dto = plainToInstance(UploadVideoDto, {
        title: 'a'.repeat(121),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.maxLength).toContain('120');
    });
  });

  describe('description validation', () => {
    it('should pass with valid description', async () => {
      const dto = plainToInstance(UploadVideoDto, {
        description: 'This is a test video description',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should preserve line breaks in description', async () => {
      const descriptionWithBreaks = `First line
Second line
Third line`;

      const dto = plainToInstance(UploadVideoDto, {
        description: descriptionWithBreaks,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.description).toContain('\n');
      expect(dto.description?.split('\n').length).toBe(3);
    });

    it('should fail with description exceeding max word count', async () => {
      const longDescription = Array.from({ length: 10001 }, () => 'word').join(
        ' ',
      );
      const dto = plainToInstance(UploadVideoDto, {
        description: longDescription,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('tags validation', () => {
    it('should pass with valid tags array', async () => {
      const dto = plainToInstance(UploadVideoDto, {
        tags: ['renungan', 'inspirasi', 'motivasi'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.tags).toEqual(['renungan', 'inspirasi', 'motivasi']);
    });

    it('should pass with empty tags (optional)', async () => {
      const dto = plainToInstance(UploadVideoDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should transform comma-separated string to array', () => {
      const dto = plainToInstance(UploadVideoDto, {
        tags: 'renungan,inspirasi,motivasi',
      });

      expect(dto.tags).toEqual(['renungan', 'inspirasi', 'motivasi']);
    });

    it('should trim whitespace from tags', () => {
      const dto = plainToInstance(UploadVideoDto, {
        tags: ['  renungan  ', ' inspirasi ', 'motivasi '],
      });

      expect(dto.tags).toEqual(['renungan', 'inspirasi', 'motivasi']);
    });

    it('should filter out empty tags', () => {
      const dto = plainToInstance(UploadVideoDto, {
        tags: ['renungan', '', '   ', 'inspirasi'],
      });

      expect(dto.tags).toEqual(['renungan', 'inspirasi']);
    });

    it('should fail with more than 10 tags', async () => {
      const dto = plainToInstance(UploadVideoDto, {
        tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.arrayMaxSize).toBeDefined();
    });

    it('should handle mixed valid and empty tags from comma string', () => {
      const dto = plainToInstance(UploadVideoDto, {
        tags: 'renungan,,  ,inspirasi,',
      });

      expect(dto.tags).toEqual(['renungan', 'inspirasi']);
    });
  });

  describe('combined validation', () => {
    it('should pass with all valid fields', async () => {
      const dto = plainToInstance(UploadVideoDto, {
        title: 'My Video Title',
        description: 'This is my video description\nWith multiple lines',
        tags: ['renungan', 'inspirasi'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accumulate multiple validation errors', async () => {
      const dto = plainToInstance(UploadVideoDto, {
        title: 'a'.repeat(121),
        description: 'a'.repeat(1001),
        tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

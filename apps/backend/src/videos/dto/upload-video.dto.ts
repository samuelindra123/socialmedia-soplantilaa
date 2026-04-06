import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MaxWordCount } from '../../common/validators/max-word-count.validator';

/**
 * DTO untuk memegang metadata dasar ketika pengguna mengunggah video.
 */
export class UploadVideoDto {
  @ApiPropertyOptional({
    description: 'Judul video agar mudah dikenali di daftar.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Judul maksimal 120 karakter' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Deskripsi video untuk konteks tambahan.',
  })
  @IsOptional()
  @IsString()
  @MaxWordCount(10_000, { message: 'Deskripsi maksimal 10.000 kata' })
  description?: string;

  @ApiPropertyOptional({
    description:
      'Tags untuk kategorisasi video. Maks 10 tags, tiap tag maks 30 karakter.',
    example: ['renungan', 'motivasi', 'inspirasi'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Tags harus berupa array' })
  @ArrayMaxSize(10, { message: 'Maksimal 10 tags' })
  @IsString({ each: true, message: 'Setiap tag harus berupa string' })
  @Transform(({ value }) => {
    // Handle both array and comma-separated string
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }
    if (Array.isArray(value)) {
      return value.map((t) => String(t).trim()).filter((t) => t.length > 0);
    }
    return [];
  })
  tags?: string[];
}

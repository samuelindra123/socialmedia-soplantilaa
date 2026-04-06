import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MaxWordCount } from '../../common/validators/max-word-count.validator';

export const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;

export class CreateResumableUploadSessionDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @Matches(/^video\//, { message: 'mimeType harus video/*' })
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_VIDEO_UPLOAD_BYTES, {
    message: 'Ukuran video maksimal 100MB',
  })
  fileSize!: number;

  @IsInt()
  @Min(1)
  totalChunks!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  chunkSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Judul maksimal 120 karakter' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxWordCount(10_000, { message: 'Deskripsi maksimal 10.000 kata' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'Tags harus berupa array' })
  @ArrayMaxSize(10, { message: 'Maksimal 10 tags' })
  @IsString({ each: true, message: 'Setiap tag harus berupa string' })
  @Transform(({ value }) => {
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

  @IsOptional()
  @IsUUID('4', { message: 'clientTaskId harus UUID v4' })
  clientTaskId?: string;
}

export class CompleteResumableUploadDto {
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Judul maksimal 120 karakter' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxWordCount(10_000, { message: 'Deskripsi maksimal 10.000 kata' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'Tags harus berupa array' })
  @ArrayMaxSize(10, { message: 'Maksimal 10 tags' })
  @IsString({ each: true, message: 'Setiap tag harus berupa string' })
  @Transform(({ value }) => {
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

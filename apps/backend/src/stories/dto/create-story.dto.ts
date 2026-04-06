import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StoryMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export const MAX_STORY_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_STORY_VIDEO_DURATION_SECONDS = 120; // 2 minutes

export class CreateStoryDto {
  @IsNotEmpty()
  @IsEnum(StoryMediaType)
  mediaType: StoryMediaType;

  @IsOptional()
  @IsString()
  caption?: string;
}

export class PresignedUrlRequestDto {
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsNotEmpty()
  @IsString()
  contentType: string;

  @IsOptional()
  @IsNumber()
  @Max(MAX_STORY_FILE_SIZE_BYTES, {
    message: 'Ukuran file terlalu besar. Maksimal 15 MB',
  })
  fileSize?: number;
}

export class GetPresignedUrlsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresignedUrlRequestDto)
  files: PresignedUrlRequestDto[];
}

export class StoryMediaItemDto {
  @IsNotEmpty()
  @IsString()
  mediaUrl: string;

  @IsNotEmpty()
  @IsEnum(StoryMediaType)
  mediaType: StoryMediaType;
}

export class CreateStoriesFromUrlsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoryMediaItemDto)
  media: StoryMediaItemDto[];

  @IsOptional()
  @IsString()
  caption?: string;
}

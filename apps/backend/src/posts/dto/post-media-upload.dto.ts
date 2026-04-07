import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaxWordCount } from '../../common/validators/max-word-count.validator';

const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_POST_VIDEO_BYTES = 100 * 1024 * 1024;

export class PostPresignedUrlRequestDto {
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsNotEmpty()
  @IsString()
  contentType: string;

  @IsOptional()
  @IsNumber()
  @Max(MAX_POST_VIDEO_BYTES, {
    message: 'Ukuran file melebihi batas maksimum 100MB',
  })
  fileSize?: number;
}

export class GetPostPresignedUrlsDto {
  @IsOptional()
  @IsIn(['image', 'video'])
  mediaType?: 'image' | 'video';

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PostPresignedUrlRequestDto)
  files: PostPresignedUrlRequestDto[];
}

export class CreatePostFromUrlsDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsNotEmpty({ message: 'Content tidak boleh kosong' })
  @IsString()
  @MaxWordCount(10_000, { message: 'Konten maksimal 10.000 kata' })
  content: string;

  @IsOptional()
  @IsIn(['text', 'media', 'image', 'video'])
  type?: 'text' | 'media' | 'image' | 'video';

  @IsOptional()
  @IsIn(['image', 'video'])
  mediaType?: 'image' | 'video';

  @IsOptional()
  tags?: string[] | string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  mediaUrls: string[];
}

export const POST_MEDIA_LIMITS = {
  MAX_POST_IMAGE_BYTES,
  MAX_POST_VIDEO_BYTES,
};

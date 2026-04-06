import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetFeedDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  userId?: string; // Filter by specific user

  @IsOptional()
  @IsString()
  mode?: string; // 'global' | 'following'

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  type?: string; // 'text' | 'media'

  @IsOptional()
  @IsString()
  currentUserId?: string;
}

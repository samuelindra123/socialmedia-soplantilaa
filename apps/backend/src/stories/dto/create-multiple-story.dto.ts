import { IsString, IsOptional } from 'class-validator';

export class CreateMultipleStoryDto {
  @IsOptional()
  @IsString()
  caption?: string;
}

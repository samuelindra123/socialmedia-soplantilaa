import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { MaxWordCount } from '../../common/validators/max-word-count.validator';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsNotEmpty({ message: 'Content tidak boleh kosong' })
  @MaxWordCount(10_000, { message: 'Konten maksimal 10.000 kata' })
  content: string;

  @IsOptional()
  @IsString()
  type?: 'text' | 'media' | 'image' | 'video';

  @IsOptional()
  @IsString()
  mediaType?: 'image' | 'video';

  @IsOptional()
  tags?: string[] | string;
}

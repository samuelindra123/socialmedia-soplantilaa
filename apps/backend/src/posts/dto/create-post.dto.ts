import { IsString, IsNotEmpty, IsOptional, IsUrl, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
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
  @IsString()
  background?: string;

  @IsOptional()
  tags?: string[] | string;

  /** Link eksternal yang disertakan dalam post (opsional, bisa satu URL atau array) */
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : [],
  )
  @IsArray()
  @IsUrl({}, { each: true, message: 'Setiap link harus berupa URL yang valid' })
  link?: string[];
}

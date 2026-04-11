import { IsString, IsOptional, IsArray, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  /** Link eksternal yang disertakan dalam post */
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : [],
  )
  @IsArray()
  @IsUrl({}, { each: true, message: 'Setiap link harus berupa URL yang valid' })
  link?: string[];
}

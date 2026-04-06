import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
} from 'class-validator';
import { MinimumAge } from '../../common/validators/minimum-age.validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  namaLengkap?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username minimal 3 karakter' })
  @MaxLength(20, { message: 'Username maksimal 20 karakter' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username hanya boleh huruf, angka, dan underscore',
  })
  username?: string;

  @IsOptional()
  @IsDateString()
  @MinimumAge(13, { message: 'Umur minimal 13 tahun' })
  tanggalLahir?: string;

  @IsOptional()
  @IsString()
  tempatKelahiran?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio maksimal 500 karakter' })
  bio?: string;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === 'string')
        ) {
          return parsed;
        }
      } catch {
        return value;
      }

      return value;
    }
    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === 'string')
    ) {
      return value;
    }

    return undefined;
  })
  websites?: string[] | string;
}

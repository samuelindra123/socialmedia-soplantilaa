import {
  IsString,
  IsNotEmpty,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { MinimumAge } from '../../common/validators/minimum-age.validator';

export class CompleteProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username minimal 3 karakter' })
  @MaxLength(20, { message: 'Username maksimal 20 karakter' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username hanya boleh huruf, angka, dan underscore',
  })
  username: string;

  @IsDateString()
  @MinimumAge(13, { message: 'Umur minimal 13 tahun' })
  tanggalLahir: string;

  @IsString()
  @IsNotEmpty()
  tempatKelahiran: string;
}

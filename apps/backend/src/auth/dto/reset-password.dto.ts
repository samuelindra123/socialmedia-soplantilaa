import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token reset tidak boleh kosong' })
  @IsString()
  token: string;

  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;
}

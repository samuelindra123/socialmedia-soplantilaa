import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  newPassword: string;

  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi' })
  confirmPassword: string;
}

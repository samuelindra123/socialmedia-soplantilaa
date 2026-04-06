import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmGoogleDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  googleId!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

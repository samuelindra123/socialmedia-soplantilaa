import { IsEmail, Matches } from 'class-validator';

export class VerifyResetOtpDto {
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;

  @Matches(/^\d{6}$/g, {
    message: 'OTP harus terdiri dari 6 digit angka',
  })
  otp: string;
}

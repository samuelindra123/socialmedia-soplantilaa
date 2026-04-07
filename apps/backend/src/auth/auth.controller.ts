import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Req,
  Res,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfirmGoogleDto } from './dto/confirm-google.dto';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { verifySignedGoogleOauthState } from './utils/google-oauth-state.util';

type RequestWithUser = Request & { user: { id: string } };

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Get('verify-email')
  verifyEmailByLink(@Query('token') token: string) {
    return this.authService.verifyEmailByLink(token);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('verify-otp/:userId')
  verifyEmailByOtp(
    @Param('userId') userId: string,
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
  ) {
    const meta = this.extractSessionMeta(req);
    return this.authService.verifyEmailByOtp(userId, dto.otp, meta);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 resends per minute
  @Post('resend-verification')
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.extractSessionMeta(req));
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 reset requests per minute
  @Post('forgot-password')
  requestReset(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 OTP attempts per minute
  @Post('forgot-password/verify-otp')
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyPasswordResetOtp(dto.email, dto.otp);
  }

  @Public()
  @Post('forgot-password/reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('sessions')
  getSessions(@Req() req: RequestWithUser) {
    return this.authService.getSessions(
      req.user.id,
      req.headers['x-session-token'],
    );
  }

  @Delete('sessions/current')
  revokeCurrentSession(@Req() req: RequestWithUser) {
    return this.authService.revokeCurrentSession(
      req.user.id,
      req.headers['x-session-token'],
    );
  }

  @Delete('sessions/:sessionId')
  revokeSession(
    @Req() req: RequestWithUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(req.user.id, sessionId);
  }

  @Post('change-password')
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Konfirmasi password tidak sama');
    }
    await this.authService.changePassword(
      req.user.id,
      dto.newPassword,
      req.headers['x-session-token'],
    );
    return { message: 'Password berhasil diperbarui' };
  }

  @Delete('google/unlink')
  unlinkGoogle(@Req() req: RequestWithUser) {
    return this.authService.unlinkGoogle(req.user.id);
  }

  @Post('report-suspicious')
  async reportSuspicious(@Req() req: RequestWithUser) {
    await this.authService.reportSuspiciousActivity(req.user.id);
    return {
      message: 'Laporan aktivitas mencurigakan telah dikirim ke email Anda',
    };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    return;
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const stateSecret =
      this.configService.get<string>('GOOGLE_OAUTH_STATE_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      '';

    const parsedState = stateSecret
      ? verifySignedGoogleOauthState(stateSecret, req.query.state)
      : null;

    const mode = parsedState?.mode || 'login';
    const redirect =
      parsedState?.redirect || (mode === 'link' ? '/pengaturan' : '/feed');

    const googleUser = (
      req as Request & {
        user?: { googleId: string; email: string; displayName?: string };
      }
    ).user;

    if (!googleUser) {
      throw new BadRequestException('Data Google tidak tersedia');
    }

    const meta = this.extractSessionMeta(req);
    const frontendBase =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    if (mode === 'link') {
      const authPayload = await this.authService.loginWithExistingGoogle(
        googleUser.googleId,
        googleUser.email,
        meta,
      );

      const settingsUrl = new URL(
        `${frontendBase}${redirect || '/pengaturan'}`,
      );

      if (!authPayload) {
        settingsUrl.searchParams.set('googleError', 'account_not_found');
        return res.redirect(settingsUrl.toString());
      }

      const oauthUrl = new URL(`${frontendBase}/oauth/callback`);
      oauthUrl.searchParams.set('token', authPayload.accessToken);
      oauthUrl.searchParams.set('sessionToken', authPayload.session.token);
      oauthUrl.searchParams.set('sessionId', authPayload.session.id);
      oauthUrl.searchParams.set('redirect', redirect || '/pengaturan');
      return res.redirect(oauthUrl.toString());
    }

    const existingAuth = await this.authService.loginWithExistingGoogle(
      googleUser.googleId,
      googleUser.email,
      meta,
    );

    if (!existingAuth) {
      const consentUrl = new URL(`${frontendBase}/oauth/consent`);
      consentUrl.searchParams.set('email', googleUser.email);
      consentUrl.searchParams.set('googleId', googleUser.googleId);
      if (googleUser.displayName) {
        consentUrl.searchParams.set('name', googleUser.displayName);
      }
      if (redirect) {
        consentUrl.searchParams.set('redirect', redirect);
      }
      consentUrl.searchParams.set('mode', mode);

      return res.redirect(consentUrl.toString());
    }

    const callbackUrl = new URL(`${frontendBase}/oauth/callback`);
    callbackUrl.searchParams.set('token', existingAuth.accessToken);
    callbackUrl.searchParams.set('sessionToken', existingAuth.session.token);
    callbackUrl.searchParams.set('sessionId', existingAuth.session.id);
    callbackUrl.searchParams.set('redirect', redirect || '/feed');

    return res.redirect(callbackUrl.toString());
  }

  @Public()
  @Post('google/confirm')
  async confirmGoogle(@Body() dto: ConfirmGoogleDto, @Req() req: Request) {
    const meta = this.extractSessionMeta(req);
    const result = await this.authService.confirmGoogleAccount(
      dto.googleId,
      dto.email,
      dto.displayName || '',
      meta,
    );

    return result;
  }

  private extractSessionMeta(req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim() || req.ip;

    return {
      userAgent: req.headers['user-agent'],
      ipAddress,
    };
  }
}

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import type {
  User as PrismaUser,
  Profile as PrismaProfile,
} from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { generateOTP, generateNumericOTP } from '../utils/otp.generator';

interface SessionMeta {
  userAgent?: string;
  ipAddress?: string;
  deviceName?: string;
}

type UserWithProfile = PrismaUser & { profile?: PrismaProfile | null };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Generate OTP dan verification token
    const otp = generateOTP();
    const verificationToken = this.generateRandomToken();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        namaLengkap: dto.namaLengkap,
        password: hashedPassword,
        verificationToken,
        verificationOtp: otp,
        otpExpiry,
      },
    });

    // Send verification email
    await this.mailService.sendVerificationEmail(
      user.email,
      verificationToken,
      otp,
    );

    return {
      message: 'Registrasi berhasil! Silakan cek email untuk verifikasi.',
      userId: user.id,
    };
  }

  async verifyEmailByLink(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token tidak valid');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email sudah terverifikasi');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationOtp: null,
        otpExpiry: null,
      },
    });

    return {
      message: 'Email berhasil diverifikasi!',
      accessToken: await this.generateAccessToken(user.id),
    };
  }

  async verifyEmailByOtp(userId: string, otp: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User tidak ditemukan');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email sudah terverifikasi');
    }

    if (!user.verificationOtp || user.verificationOtp !== otp) {
      throw new BadRequestException('OTP tidak valid');
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      throw new BadRequestException('OTP sudah expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationOtp: null,
        otpExpiry: null,
      },
    });

    return {
      message: 'Email berhasil diverifikasi!',
      accessToken: await this.generateAccessToken(user.id),
    };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User tidak ditemukan');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email sudah terverifikasi');
    }

    const otp = generateOTP();
    const verificationToken = this.generateRandomToken();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationOtp: otp,
        otpExpiry,
      },
    });

    await this.mailService.sendVerificationEmail(
      user.email,
      verificationToken,
      otp,
    );

    return { message: 'Email verifikasi telah dikirim ulang' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('Email tidak terdaftar');
    }

    const otp = generateNumericOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtp: otp,
        resetPasswordOtpExpiry: otpExpiry,
        resetPasswordToken: null,
      },
    });

    await this.mailService.sendPasswordResetEmail(user.email, otp);

    return {
      message: 'Kode reset password telah dikirim ke email Anda',
    };
  }

  async verifyPasswordResetOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.resetPasswordOtp) {
      throw new BadRequestException('OTP tidak valid');
    }

    if (user.resetPasswordOtp !== otp) {
      throw new BadRequestException('OTP tidak valid');
    }

    if (
      !user.resetPasswordOtpExpiry ||
      new Date() > user.resetPasswordOtpExpiry
    ) {
      throw new BadRequestException('OTP sudah expired');
    }

    const resetToken = this.generateRandomToken();
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordOtp: null,
        resetPasswordOtpExpiry: tokenExpiry,
      },
    });

    return {
      message: 'OTP valid, silakan atur password baru',
      resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token reset tidak valid');
    }

    if (
      !user.resetPasswordOtpExpiry ||
      new Date() > user.resetPasswordOtpExpiry
    ) {
      throw new BadRequestException('Token reset sudah kedaluwarsa');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordOtp: null,
        resetPasswordOtpExpiry: null,
      },
    });

    return { message: 'Password berhasil diperbarui, silakan login kembali' };
  }

  async login(dto: LoginDto, meta: SessionMeta = {}) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true }, // Include profile to check onboarding status
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email belum terverifikasi');
    }

    return this.buildAuthResponse(user, meta);
  }

  private async generateAccessToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload);
  }

  private generateRandomToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private deriveDeviceName(userAgent?: string): string | null {
    if (!userAgent) return null;
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('Windows')) return 'Windows PC';
    return 'Perangkat Lain';
  }

  private async createSession(userId: string, meta: SessionMeta = {}) {
    const sessionToken = this.generateRandomToken();
    const session = await this.prisma.userSession.create({
      data: {
        userId,
        sessionToken,
        deviceName: meta.deviceName || this.deriveDeviceName(meta.userAgent),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    return {
      id: session.id,
      token: session.sessionToken,
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      lastSeen: session.lastSeen,
      createdAt: session.createdAt,
    };
  }

  private async buildAuthResponse(
    user: UserWithProfile,
    meta: SessionMeta = {},
  ) {
    const loadedUser: UserWithProfile | null = user.profile
      ? user
      : ((await this.prisma.user.findUnique({
          where: { id: user.id },
          include: { profile: true },
        })) as UserWithProfile | null);

    if (!loadedUser) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    const userPayload: UserWithProfile = loadedUser;

    const session = await this.createSession(userPayload.id, meta);
    return {
      accessToken: await this.generateAccessToken(userPayload.id),
      session,
      user: {
        id: userPayload.id,
        email: userPayload.email,
        namaLengkap: userPayload.namaLengkap,
        googleId: userPayload.googleId,
        profile: userPayload.profile,
      },
    };
  }

  private async findUserByGoogleOrEmail(
    googleId: string,
    email: string,
  ): Promise<UserWithProfile | null> {
    return (await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
      include: { profile: true },
    })) as UserWithProfile | null;
  }

  async loginWithExistingGoogle(
    googleId: string,
    email: string,
    meta: SessionMeta = {},
  ) {
    const existing = await this.findUserByGoogleOrEmail(googleId, email);
    if (!existing) {
      return null;
    }

    let userToUse: UserWithProfile = existing;

    if (!existing.googleId) {
      userToUse = (await this.prisma.user.update({
        where: { id: existing.id },
        data: { googleId, isEmailVerified: true },
        include: { profile: true },
      })) as UserWithProfile;
    }

    return this.buildAuthResponse(userToUse, meta);
  }

  async confirmGoogleAccount(
    googleId: string,
    email: string,
    displayName: string,
    meta: SessionMeta = {},
  ) {
    const existing = await this.findUserByGoogleOrEmail(googleId, email);
    if (existing) {
      return this.loginWithExistingGoogle(googleId, email, meta);
    }

    const randomPassword = await bcrypt.hash(
      Math.random().toString(36).slice(-12),
      10,
    );

    const user = (await this.prisma.user.create({
      data: {
        email,
        googleId,
        namaLengkap: displayName || 'Pengguna Google',
        password: randomPassword,
        isEmailVerified: true,
        profile: {
          create: {
            username: `${displayName?.split(' ')[0] || 'user'}-${Date.now()}`,
            tanggalLahir: new Date(),
            umur: 18,
            tempatKelahiran: 'Indonesia',
          },
        },
      },
      include: { profile: true },
    })) as UserWithProfile;

    return this.buildAuthResponse(user, meta);
  }

  async touchSession(userId: string, sessionToken?: string | string[]) {
    if (!sessionToken || Array.isArray(sessionToken)) return;
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        sessionToken,
        revokedAt: null,
      },
      data: { lastSeen: new Date() },
    });
  }

  async getSessions(userId: string, currentToken?: string | string[]) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceName: session.deviceName,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastSeen: session.lastSeen,
      revokedAt: session.revokedAt,
      isCurrent:
        !!currentToken && !Array.isArray(currentToken)
          ? session.sessionToken === currentToken
          : false,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new BadRequestException('Sesi tidak ditemukan');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeCurrentSession(userId: string, sessionToken?: string | string[]) {
    if (!sessionToken || Array.isArray(sessionToken)) return;
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        sessionToken,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(
    userId: string,
    newPassword: string,
    currentSessionToken?: string | string[],
  ) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    const currentTokenValue =
      currentSessionToken && !Array.isArray(currentSessionToken)
        ? currentSessionToken
        : null;

    await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentTokenValue
          ? { sessionToken: { not: currentTokenValue } }
          : {}),
      },
      data: { revokedAt: new Date() },
    });
  }

  async handleGoogleLogin(userId: string, meta: SessionMeta = {}) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    return this.buildAuthResponse(user, meta);
  }

  async unlinkGoogle(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { googleId: null },
    });
  }

  async reportSuspiciousActivity(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User tidak ditemukan');
    }

    await this.mailService.sendSuspiciousActivityEmail(
      user.email,
      user.namaLengkap,
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { EmailType, EMAIL_SUBJECTS, EMAIL_QUEUE_NAME } from './email.constants';

interface SendEmailData {
  to: string;
  userId?: string;
  type: EmailType;
  data: Record<string, unknown>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(EMAIL_QUEUE_NAME) private emailQueue: Queue,
  ) {}

  async sendEmail(emailData: SendEmailData): Promise<void> {
    const { to, userId, type, data } = emailData;
    const subject = EMAIL_SUBJECTS[type];

    const emailLog = await this.prisma.emailLog.create({
      data: { userId, email: to, type, subject, status: 'PENDING' },
    });

    await this.emailQueue.add(
      'send-email',
      { emailLogId: emailLog.id, to, subject, type, data },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    );

    this.logger.log(`Email queued: ${type} to ${to}`);
  }

  async sendWelcomeEmail(userId: string, email: string, name: string) {
    await this.sendEmail({
      to: email,
      userId,
      type: EmailType.WELCOME,
      data: { name },
    });
  }

  async sendOTPEmail(email: string, otp: string, userId?: string) {
    await this.sendEmail({
      to: email,
      userId,
      type: EmailType.OTP_VERIFICATION,
      data: { otp },
    });
  }

  async sendLoginNewDeviceEmail(
    userId: string,
    email: string,
    device: string,
    time: Date,
  ) {
    await this.sendEmail({
      to: email,
      userId,
      type: EmailType.LOGIN_NEW_DEVICE,
      data: { device, time },
    });
  }

  async sendPasswordChangedEmail(userId: string, email: string, time: Date) {
    await this.sendEmail({
      to: email,
      userId,
      type: EmailType.PASSWORD_CHANGED,
      data: { time },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userId?: string,
  ) {
    const resetUrl = `${process.env.FRONTEND_URL}/forgot-password/new-password?token=${resetToken}`;
    await this.sendEmail({
      to: email,
      userId,
      type: EmailType.PASSWORD_RESET,
      data: { resetUrl },
    });
  }

  async sendAccountLockedEmail(
    userId: string,
    email: string,
    unlockTime: Date,
  ) {
    await this.sendEmail({
      to: email,
      userId,
      type: EmailType.ACCOUNT_LOCKED,
      data: { unlockTime },
    });
  }

  async sendAccountUnlockedEmail(userId: string, email: string) {
    await this.sendEmail({
      to: email,
      userId,
      type: EmailType.ACCOUNT_UNLOCKED,
      data: {},
    });
  }
}

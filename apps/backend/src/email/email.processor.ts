import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { createTransport } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EMAIL_QUEUE_NAME, EmailType } from './email.constants';
import { renderWelcomeEmail } from './templates/welcome.template';
import { renderOTPEmail } from './templates/otp.template';
import { renderSecurityAlertEmail } from './templates/security-alert.template';
import { renderPasswordResetEmail } from './templates/password-reset.template';

interface EmailJobData {
  emailLogId: string;
  to: string;
  subject: string;
  type: EmailType;
  data: Record<string, unknown>;
}

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private getTransporter() {
    return createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  private renderTemplate(
    type: EmailType,
    data: Record<string, unknown>,
  ): string {
    const baseUrl = process.env.FRONTEND_URL ?? 'https://soplantila.com';
    const d = { ...data, baseUrl };
    switch (type) {
      case EmailType.WELCOME:
        return renderWelcomeEmail(
          d as unknown as Parameters<typeof renderWelcomeEmail>[0],
        );
      case EmailType.OTP_VERIFICATION:
        return renderOTPEmail(
          d as unknown as Parameters<typeof renderOTPEmail>[0],
        );
      case EmailType.PASSWORD_RESET:
        return renderPasswordResetEmail(
          d as unknown as Parameters<typeof renderPasswordResetEmail>[0],
        );
      default:
        return renderSecurityAlertEmail({ type, ...d } as unknown as Parameters<
          typeof renderSecurityAlertEmail
        >[0]);
    }
  }

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    const { emailLogId, to, subject, type, data } = job.data;

    try {
      const html = this.renderTemplate(type, data);
      const transporter = this.getTransporter();

      await transporter.sendMail({
        from:
          this.configService.get('SMTP_FROM_EMAIL') || 'noreply@soplantila.com',
        to,
        subject,
        html,
      });

      await this.prisma.emailLog.update({
        where: { id: emailLogId },
        data: { status: 'SENT', sentAt: new Date() },
      });

      this.logger.log(`Email sent: ${type} to ${to}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      await this.prisma.emailLog.update({
        where: { id: emailLogId },
        data: { status: 'FAILED', error: message },
      });

      this.logger.error(`Email failed: ${type} to ${to} - ${message}`, stack);
      throw error;
    }
  }
}

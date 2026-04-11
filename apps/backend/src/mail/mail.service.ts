import { Injectable } from '@nestjs/common';
import { ResendService } from 'nestjs-resend';
import { emailBase, btn, infoBox } from '../email/templates/base.template';

@Injectable()
export class MailService {
  constructor(private readonly resendService: ResendService) {}

  private from(): string {
    const name = process.env.RESEND_FROM_NAME?.trim() || 'Soplantila';
    const email = process.env.RESEND_FROM_EMAIL?.trim() || 'noreply@soplantila.com';
    return `${name} <${email}>`;
  }

  private baseUrl(): string {
    return (process.env.MAIL_WEBSITE_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  }

  private support(): string {
    return process.env.MAIL_SUPPORT_EMAIL?.trim() || 'support@soplantila.com';
  }

  private supportLine(): string {
    return `<p style="margin:32px 0 0;padding-top:24px;border-top:1px solid #f4f4f5;font-size:12px;color:#a1a1aa;line-height:1.6;">
      Ada pertanyaan? Hubungi <a href="mailto:${this.support()}" style="color:#18181b;text-decoration:none;font-weight:500;">${this.support()}</a>
    </p>`;
  }

  async sendVerificationEmail(email: string, token: string, otp: string) {
    const verifyUrl = `${this.baseUrl()}/verify?token=${token}`;

    const body = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Verifikasi akun kamu</h1>
      <p style="margin:0 0 28px;font-size:14px;color:#71717a;line-height:1.6;">Masukkan kode di bawah untuk mengaktifkan akun Soplantila kamu.</p>

      <div style="background:#f4f4f5;border-radius:6px;padding:24px;text-align:center;margin:0 0 20px;">
        <span style="font-size:36px;font-weight:700;color:#18181b;letter-spacing:12px;font-family:'Courier New',Courier,monospace;">${otp}</span>
      </div>

      <p style="margin:0 0 24px;font-size:13px;color:#71717a;line-height:1.6;">
        Kode berlaku selama <strong style="color:#3f3f46;">15 menit</strong>. Jangan bagikan kode ini ke siapa pun.
      </p>

      ${btn('Verifikasi Akun', verifyUrl)}

      <p style="margin:20px 0 0;font-size:12px;color:#71717a;">
        Atau buka link ini: <a href="${verifyUrl}" style="color:#18181b;word-break:break-all;">${verifyUrl}</a>
      </p>

      <div style="background:#fefce8;border-left:3px solid #eab308;border-radius:0 4px 4px 0;padding:12px 16px;margin:24px 0 0;">
        <p style="margin:0;font-size:12px;color:#713f12;line-height:1.6;">
          Jika kamu tidak mendaftar di Soplantila, abaikan email ini.
        </p>
      </div>
      ${this.supportLine()}
    `;

    const html = emailBase({
      title: 'Verifikasi Email – Soplantila',
      preheader: `Kode verifikasi kamu: ${otp}. Berlaku 15 menit.`,
      body,
      baseUrl: this.baseUrl(),
    });

    await this.resendService.send({
      from: this.from(),
      to: email,
      subject: 'Verifikasi Email – Soplantila',
      html,
      text: `Kode verifikasi Soplantila: ${otp}\n\nAtau klik: ${verifyUrl}\n\nBerlaku 15 menit.`,
    });
  }

  async sendPasswordResetEmail(email: string, otp: string) {
    const body = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Reset password</h1>
      <p style="margin:0 0 28px;font-size:14px;color:#71717a;line-height:1.6;">Masukkan kode di bawah untuk mereset password akun Soplantila kamu.</p>

      <div style="background:#f4f4f5;border-radius:6px;padding:24px;text-align:center;margin:0 0 20px;">
        <span style="font-size:36px;font-weight:700;color:#18181b;letter-spacing:12px;font-family:'Courier New',Courier,monospace;">${otp}</span>
      </div>

      <p style="margin:0 0 24px;font-size:13px;color:#71717a;line-height:1.6;">
        Kode berlaku selama <strong style="color:#3f3f46;">15 menit</strong>. Jangan bagikan kode ini ke siapa pun.
      </p>

      <div style="background:#fef2f2;border-left:3px solid #ef4444;border-radius:0 4px 4px 0;padding:12px 16px;">
        <p style="margin:0;font-size:12px;color:#7f1d1d;line-height:1.6;">
          Jika kamu tidak meminta reset password, abaikan email ini. Password kamu tidak akan berubah.
        </p>
      </div>
      ${this.supportLine()}
    `;

    const html = emailBase({
      title: 'Reset Password – Soplantila',
      preheader: `Kode reset password kamu: ${otp}. Berlaku 15 menit.`,
      body,
      baseUrl: this.baseUrl(),
    });

    await this.resendService.send({
      from: this.from(),
      to: email,
      subject: 'Reset Password – Soplantila',
      html,
      text: `Kode reset password Soplantila: ${otp}\n\nBerlaku 15 menit. Jangan bagikan kode ini.`,
    });
  }

  async sendSuspiciousActivityEmail(email: string, namaLengkap: string) {
    const body = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Laporan aktivitas mencurigakan</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
        Halo <strong style="color:#18181b;">${namaLengkap || 'Pengguna'}</strong>, kami menerima laporan aktivitas mencurigakan pada akun kamu.
      </p>

      ${infoBox([['Email', email]])}

      <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;font-weight:600;">Langkah yang disarankan:</p>
      <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#3f3f46;line-height:1.8;">
        <li>Segera ganti password dari Pengaturan → Keamanan.</li>
        <li>Periksa sesi aktif dan putuskan perangkat yang tidak dikenal.</li>
        <li>Jangan bagikan kode OTP atau password ke siapa pun.</li>
      </ul>

      ${btn('Amankan Akun', `${this.baseUrl()}/settings/security`, '#dc2626')}

      <div style="background:#fef2f2;border-left:3px solid #ef4444;border-radius:0 4px 4px 0;padding:12px 16px;margin:24px 0 0;">
        <p style="margin:0;font-size:12px;color:#7f1d1d;line-height:1.6;">
          Jika kamu tidak merasa mengirim laporan ini, abaikan email ini.
        </p>
      </div>
      ${this.supportLine()}
    `;

    const html = emailBase({
      title: 'Peringatan Keamanan – Soplantila',
      preheader: 'Kami menerima laporan aktivitas mencurigakan pada akun kamu.',
      body,
      baseUrl: this.baseUrl(),
    });

    await this.resendService.send({
      from: this.from(),
      to: email,
      subject: 'Peringatan Aktivitas Mencurigakan – Soplantila',
      html,
      text: `Kami menerima laporan aktivitas mencurigakan pada akun Soplantila kamu.\n\nSegera ganti password dan periksa sesi aktif.\n\nBantuan: ${this.support()}`,
    });
  }
}

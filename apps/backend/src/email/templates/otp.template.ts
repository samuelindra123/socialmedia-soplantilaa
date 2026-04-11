import { emailBase } from './base.template';

interface OTPEmailProps {
  otp: string;
  baseUrl: string;
}

export function renderOTPEmail({ otp, baseUrl }: OTPEmailProps): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Kode verifikasi kamu</h1>
    <p style="margin:0 0 32px;font-size:14px;color:#71717a;line-height:1.6;">Gunakan kode di bawah untuk verifikasi akun Soplantila.</p>

    <!-- OTP code -->
    <div style="background:#f4f4f5;border-radius:6px;padding:24px;text-align:center;margin:0 0 24px;">
      <span style="font-size:36px;font-weight:700;color:#18181b;letter-spacing:12px;font-family:'Courier New',Courier,monospace;">${otp}</span>
    </div>

    <p style="margin:0 0 24px;font-size:13px;color:#71717a;line-height:1.6;">
      Kode berlaku selama <strong style="color:#3f3f46;">15 menit</strong>. Jangan bagikan kode ini ke siapa pun.
    </p>

    <div style="background:#fefce8;border-left:3px solid #eab308;border-radius:0 4px 4px 0;padding:12px 16px;">
      <p style="margin:0;font-size:12px;color:#713f12;line-height:1.6;">
        Jika kamu tidak meminta kode ini, abaikan email ini. Akun kamu tetap aman.
      </p>
    </div>

    <p style="margin:32px 0 0;padding-top:24px;border-top:1px solid #f4f4f5;font-size:12px;color:#a1a1aa;line-height:1.6;">
      Ada pertanyaan? Hubungi <a href="mailto:support@soplantila.com" style="color:#18181b;text-decoration:none;font-weight:500;">support@soplantila.com</a>
    </p>
  `;

  return emailBase({ title: 'Kode Verifikasi Soplantila', preheader: `Kode verifikasi kamu: ${otp}. Berlaku 15 menit.`, body, baseUrl });
}

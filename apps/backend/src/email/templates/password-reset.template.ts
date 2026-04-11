import { emailBase, btn } from './base.template';

interface PasswordResetEmailProps {
  resetUrl: string;
  baseUrl: string;
}

export function renderPasswordResetEmail({ resetUrl, baseUrl }: PasswordResetEmailProps): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Reset password</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">Kami menerima permintaan untuk mereset password akun Soplantila kamu.</p>

    <p style="margin:0 0 4px;font-size:14px;color:#3f3f46;line-height:1.7;">
      Klik tombol di bawah untuk membuat password baru. Link berlaku selama <strong style="color:#18181b;">15 menit</strong>.
    </p>

    ${btn('Reset Password', resetUrl)}

    <p style="margin:24px 0 0;font-size:13px;color:#71717a;line-height:1.6;">
      Atau copy link ini ke browser:
    </p>
    <p style="margin:8px 0 24px;font-size:12px;word-break:break-all;">
      <a href="${resetUrl}" style="color:#18181b;text-decoration:none;">${resetUrl}</a>
    </p>

    <div style="background:#fef2f2;border-left:3px solid #ef4444;border-radius:0 4px 4px 0;padding:12px 16px;">
      <p style="margin:0;font-size:12px;color:#7f1d1d;line-height:1.6;">
        Jika kamu tidak meminta reset password, abaikan email ini. Password kamu tidak akan berubah.
      </p>
    </div>

    <p style="margin:32px 0 0;padding-top:24px;border-top:1px solid #f4f4f5;font-size:12px;color:#a1a1aa;line-height:1.6;">
      Ada pertanyaan? Hubungi <a href="mailto:support@soplantila.com" style="color:#18181b;text-decoration:none;font-weight:500;">support@soplantila.com</a>
    </p>
  `;

  return emailBase({ title: 'Reset Password Soplantila', preheader: 'Kamu meminta reset password. Klik link untuk melanjutkan.', body, baseUrl });
}

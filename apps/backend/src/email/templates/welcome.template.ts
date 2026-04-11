import { emailBase, btn } from './base.template';

interface WelcomeEmailProps {
  name: string;
  baseUrl: string;
}

export function renderWelcomeEmail({ name, baseUrl }: WelcomeEmailProps): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Selamat datang, ${name}!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">Akun Soplantila kamu sudah aktif.</p>

    <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.7;">
      Soplantila adalah ruang untuk menulis refleksi, terhubung dengan orang-orang yang menginspirasi, dan menemukan ketenangan di tengah kebisingan digital.
    </p>

    <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.7;">
      Mulai dengan menulis refleksi pertama kamu atau jelajahi feed untuk menemukan konten yang bermakna.
    </p>

    ${btn('Buka Soplantila', `${baseUrl}/feed`)}

    <p style="margin:32px 0 0;padding-top:24px;border-top:1px solid #f4f4f5;font-size:12px;color:#a1a1aa;line-height:1.6;">
      Ada pertanyaan? Balas email ini atau hubungi <a href="mailto:support@soplantila.com" style="color:#18181b;text-decoration:none;font-weight:500;">support@soplantila.com</a>
    </p>
  `;

  return emailBase({ title: 'Selamat Datang di Soplantila', preheader: `Halo ${name}, akun kamu sudah siap digunakan.`, body, baseUrl });
}

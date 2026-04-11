import { emailBase, btn, infoBox } from './base.template';

interface SecurityAlertEmailProps {
  type: 'device' | 'location' | 'password_changed' | 'account_locked' | 'account_unlocked';
  device?: string;
  location?: string;
  ipAddress?: string;
  time?: Date;
  unlockTime?: Date;
  baseUrl: string;
}

export function renderSecurityAlertEmail(props: SecurityAlertEmailProps): string {
  const { type, device, location, ipAddress, time, unlockTime, baseUrl } = props;

  const fmt = (d?: Date) => d?.toLocaleString('id-ID') ?? '-';

  type Config = { title: string; preheader: string; body: string };

  const configs: Record<SecurityAlertEmailProps['type'], Config> = {
    device: {
      title: 'Login dari Perangkat Baru',
      preheader: 'Kami mendeteksi login dari perangkat baru ke akun kamu.',
      body: `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Login dari perangkat baru</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">Kami mendeteksi login ke akun Soplantila kamu dari perangkat yang tidak dikenal.</p>
        ${infoBox([['Perangkat', device ?? '-'], ['Lokasi', location ?? '-'], ['Waktu', fmt(time)]])}
        <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.7;">Jika ini bukan kamu, segera amankan akun dengan mengubah password.</p>
        ${btn('Amankan Akun', `${baseUrl}/settings/security`, '#dc2626')}
      `,
    },
    location: {
      title: 'Login dari Lokasi Baru',
      preheader: 'Kami mendeteksi login dari lokasi yang berbeda.',
      body: `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Login dari lokasi baru</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">Kami mendeteksi login ke akun kamu dari lokasi yang berbeda dari biasanya.</p>
        ${infoBox([['Lokasi', location ?? '-'], ['IP Address', ipAddress ?? '-'], ['Waktu', fmt(time)]])}
        <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.7;">Jika ini bukan kamu, segera amankan akun kamu.</p>
        ${btn('Cek Aktivitas', `${baseUrl}/settings/security`, '#dc2626')}
      `,
    },
    password_changed: {
      title: 'Password Berhasil Diubah',
      preheader: 'Password akun Soplantila kamu berhasil diubah.',
      body: `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Password diubah</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">Password akun Soplantila kamu berhasil diubah.</p>
        ${infoBox([['Waktu', fmt(time)]])}
        <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.7;">Jika kamu tidak melakukan perubahan ini, segera hubungi support kami.</p>
        ${btn('Lihat Pengaturan', `${baseUrl}/settings/security`)}
      `,
    },
    account_locked: {
      title: 'Akun Dikunci Sementara',
      preheader: 'Akun kamu dikunci karena terlalu banyak percobaan login yang gagal.',
      body: `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Akun dikunci sementara</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">Akun kamu dikunci karena terlalu banyak percobaan login yang gagal.</p>
        <div style="background:#fefce8;border-left:3px solid #eab308;border-radius:0 4px 4px 0;padding:12px 16px;margin:0 0 20px;">
          <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6;">
            Akun akan aktif kembali pada: <strong>${fmt(unlockTime)}</strong>
          </p>
        </div>
        <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.7;">Jika kamu lupa password, gunakan fitur reset password.</p>
        ${btn('Reset Password', `${baseUrl}/forgot-password`)}
      `,
    },
    account_unlocked: {
      title: 'Akun Sudah Aktif Kembali',
      preheader: 'Akun Soplantila kamu sudah aktif dan bisa digunakan.',
      body: `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Akun aktif kembali</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">Akun Soplantila kamu sudah aktif dan bisa digunakan kembali.</p>
        <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.7;">Pastikan menggunakan password yang kuat untuk keamanan akun kamu.</p>
        ${btn('Login Sekarang', `${baseUrl}/login`)}
      `,
    },
  };

  const { title, preheader, body } = configs[type];
  return emailBase({ title, preheader, body: body + footer(), baseUrl });
}

function footer(): string {
  return `<p style="margin:32px 0 0;padding-top:24px;border-top:1px solid #f4f4f5;font-size:12px;color:#a1a1aa;line-height:1.6;">
    Ada pertanyaan? Hubungi <a href="mailto:support@soplantila.com" style="color:#18181b;text-decoration:none;font-weight:500;">support@soplantila.com</a>
  </p>`;
}

interface SecurityAlertEmailProps {
  type:
    | 'device'
    | 'location'
    | 'password_changed'
    | 'account_locked'
    | 'account_unlocked';
  device?: string;
  location?: string;
  ipAddress?: string;
  time?: Date;
  unlockTime?: Date;
  baseUrl: string;
}

export function renderSecurityAlertEmail(
  props: SecurityAlertEmailProps,
): string {
  const { type, device, location, ipAddress, time, unlockTime, baseUrl } =
    props;

  let icon = '🔐';
  let title = 'Notifikasi Keamanan';
  let message = '';
  let actionButton = '';

  switch (type) {
    case 'device':
      icon = '📱';
      title = 'Login dari Perangkat Baru';
      message = `
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Kami mendeteksi login baru ke akun Soplantila kamu dari perangkat yang tidak dikenal:
        </p>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 0 0 20px 0; text-align: left;">
          <p style="color: #1e293b; font-size: 14px; margin: 0 0 10px 0;"><strong>Perangkat:</strong> ${device}</p>
          <p style="color: #1e293b; font-size: 14px; margin: 0 0 10px 0;"><strong>Lokasi:</strong> ${location}</p>
          <p style="color: #1e293b; font-size: 14px; margin: 0;"><strong>Waktu:</strong> ${time?.toLocaleString('id-ID')}</p>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
          Jika ini bukan kamu, segera ubah password dan hubungi tim support kami.
        </p>
      `;
      actionButton = `<a href="${baseUrl}/settings/security" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">Amankan Akun</a>`;
      break;

    case 'location':
      icon = '🌍';
      title = 'Login dari Lokasi Baru';
      message = `
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Kami mendeteksi login ke akun kamu dari lokasi yang berbeda:
        </p>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 0 0 20px 0; text-align: left;">
          <p style="color: #1e293b; font-size: 14px; margin: 0 0 10px 0;"><strong>Lokasi:</strong> ${location}</p>
          <p style="color: #1e293b; font-size: 14px; margin: 0 0 10px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
          <p style="color: #1e293b; font-size: 14px; margin: 0;"><strong>Waktu:</strong> ${time?.toLocaleString('id-ID')}</p>
        </div>
      `;
      actionButton = `<a href="${baseUrl}/settings/security" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">Cek Aktivitas</a>`;
      break;

    case 'password_changed':
      icon = '✅';
      title = 'Password Berhasil Diubah';
      message = `
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Password akun Soplantila kamu berhasil diubah pada:
        </p>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 0 0 20px 0;">
          <p style="color: #1e293b; font-size: 14px; margin: 0;"><strong>Waktu:</strong> ${time?.toLocaleString('id-ID')}</p>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
          Jika kamu tidak melakukan perubahan ini, segera hubungi tim support kami.
        </p>
      `;
      actionButton = `<a href="${baseUrl}/settings/security" style="display: inline-block; background-color: #1e293b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">Lihat Pengaturan</a>`;
      break;

    case 'account_locked':
      icon = '🔒';
      title = 'Akun Dikunci Sementara';
      message = `
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Akun kamu dikunci sementara karena terlalu banyak percobaan login yang gagal.
        </p>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 0 0 20px 0;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            <strong>Akun akan aktif kembali pada:</strong><br>
            ${unlockTime?.toLocaleString('id-ID')}
          </p>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
          Ini adalah langkah keamanan untuk melindungi akun kamu. Jika kamu lupa password, gunakan fitur reset password.
        </p>
      `;
      actionButton = `<a href="${baseUrl}/forgot-password" style="display: inline-block; background-color: #1e293b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">Reset Password</a>`;
      break;

    case 'account_unlocked':
      icon = '🔓';
      title = 'Akun Sudah Aktif Kembali';
      message = `
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Akun Soplantila kamu sudah aktif kembali dan bisa digunakan.
        </p>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
          Pastikan untuk menggunakan password yang kuat dan unik untuk keamanan akun kamu.
        </p>
      `;
      actionButton = `<a href="${baseUrl}/login" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">Login Sekarang</a>`;
      break;
  }

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px; text-align: center;">
              <div style="font-size: 40px; margin-bottom: 10px;">${icon}</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">${title}</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              ${message}
              
              ${
                actionButton
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    ${actionButton}
                  </td>
                </tr>
              </table>
              `
                  : ''
              }
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0;">
                Butuh bantuan? <a href="${baseUrl}/help" style="color: #3b82f6; text-decoration: none;">Hubungi Support</a>
              </p>
              <p style="color: #cbd5e1; font-size: 12px; margin: 0;">
                © 2026 Soplantila. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

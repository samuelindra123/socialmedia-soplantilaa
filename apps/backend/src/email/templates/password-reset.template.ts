interface PasswordResetEmailProps {
  resetUrl: string;
  baseUrl: string;
}

export function renderPasswordResetEmail({
  resetUrl,
  baseUrl,
}: PasswordResetEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password Soplantila</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px; text-align: center;">
              <div style="font-size: 40px; margin-bottom: 10px;">🔑</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Reset Password</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Kamu meminta untuk reset password akun Soplantila. Klik tombol di bawah untuk membuat password baru:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #1e293b; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(30, 41, 59, 0.3);">
                      Reset Password Sekarang
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Link ini berlaku selama <strong>15 menit</strong>. Jika kamu tidak meminta reset password, abaikan email ini.
              </p>

              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                  Atau copy link ini ke browser:<br>
                  <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
                </p>
              </div>
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

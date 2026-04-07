interface OTPEmailProps {
  otp: string;
  baseUrl: string;
}

export function renderOTPEmail({ otp, baseUrl }: OTPEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Verifikasi Soplantila</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px; text-align: center;">
              <div style="font-size: 40px; margin-bottom: 10px;">🔐</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Kode Verifikasi</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px; text-align: center;">
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Gunakan kode di bawah ini untuk verifikasi akun Soplantila kamu:
              </p>

              <!-- OTP Code -->
              <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border: 2px solid #cbd5e1; border-radius: 12px; padding: 30px; margin: 0 0 30px 0;">
                <div style="font-size: 48px; font-weight: 700; color: #1e293b; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>

              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Kode ini berlaku selama <strong>15 menit</strong>. Jangan bagikan kode ini ke siapa pun.
              </p>

              <!-- Security Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; text-align: left; margin-top: 30px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>⚠️ Perhatian:</strong> Tim Soplantila tidak akan pernah meminta kode verifikasi kamu. Jika kamu tidak meminta kode ini, abaikan email ini.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
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

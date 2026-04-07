interface WelcomeEmailProps {
  name: string;
  baseUrl: string;
}

export function renderWelcomeEmail({
  name,
  baseUrl,
}: WelcomeEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Selamat Datang di Soplantila</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 50px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🌱</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Soplantila</h1>
              <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 16px;">Ruang refleksi digital yang tenang</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 28px; font-weight: 700;">Halo, ${name}! 👋</h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Selamat datang di <strong>Soplantila</strong> — platform sosial yang dirancang untuk refleksi diri tanpa kebisingan notifikasi berlebihan.
              </p>

              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Kami senang kamu bergabung! Yuk mulai berbagi pemikiran dan terhubung dengan komunitas yang positif.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${baseUrl}/feed" style="display: inline-block; background-color: #1e293b; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(30, 41, 59, 0.3);">
                      Mulai Eksplorasi
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Features -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                <h3 style="color: #1e293b; font-size: 20px; margin: 0 0 20px 0;">Yang bisa lo lakukan:</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 15px 0;">
                      <div style="display: flex; align-items: start;">
                        <div style="font-size: 24px; margin-right: 15px;">✍️</div>
                        <div>
                          <strong style="color: #1e293b; font-size: 16px;">Tulis Refleksi</strong>
                          <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0; line-height: 1.5;">Bagikan pemikiran dan renungan harian kamu</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0;">
                      <div style="display: flex; align-items: start;">
                        <div style="font-size: 24px; margin-right: 15px;">👥</div>
                        <div>
                          <strong style="color: #1e293b; font-size: 16px;">Terhubung</strong>
                          <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0; line-height: 1.5;">Follow teman dan komunitas yang menginspirasi</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0;">
                      <div style="display: flex; align-items: start;">
                        <div style="font-size: 24px; margin-right: 15px;">🔔</div>
                        <div>
                          <strong style="color: #1e293b; font-size: 16px;">Notifikasi Tenang</strong>
                          <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0; line-height: 1.5;">Tanpa spam, hanya update yang penting</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
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
              <p style="margin: 15px 0 0 0;">
                <a href="${baseUrl}" style="color: #94a3b8; text-decoration: none; font-size: 12px; margin: 0 10px;">Home</a>
                <a href="${baseUrl}/privacy" style="color: #94a3b8; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy</a>
                <a href="${baseUrl}/terms" style="color: #94a3b8; text-decoration: none; font-size: 12px; margin: 0 10px;">Terms</a>
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

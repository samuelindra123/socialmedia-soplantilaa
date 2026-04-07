import { Injectable } from '@nestjs/common';
import { ResendService } from 'nestjs-resend';

@Injectable()
export class MailService {
  constructor(private readonly resendService: ResendService) {}

  private getResendFrom(): string {
    const fromName = process.env.RESEND_FROM_NAME?.trim() || 'Renunganku';
    const fromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() || 'noreply@example.com';

    return `${fromName} <${fromEmail}>`;
  }

  private getWebsiteUrl(): string {
    return (
      process.env.MAIL_WEBSITE_URL?.trim() ||
      process.env.FRONTEND_URL?.trim() ||
      'http://localhost:3000'
    );
  }

  private getPrivacyUrl(): string {
    const directPrivacyUrl = process.env.MAIL_PRIVACY_URL?.trim();
    if (directPrivacyUrl) return directPrivacyUrl;

    return `${this.getWebsiteUrl().replace(/\/$/, '')}/privacy`;
  }

  private getSupportEmail(): string {
    return process.env.MAIL_SUPPORT_EMAIL?.trim() || 'support@example.com';
  }

  async sendVerificationEmail(email: string, token: string, otp: string) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${token}`;
    const websiteUrl = this.getWebsiteUrl();
    const privacyUrl = this.getPrivacyUrl();
    const supportEmail = this.getSupportEmail();
    const resendFrom = this.getResendFrom();

    const html = `
      <!doctype html>
      <html lang="id" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <title>Verifikasi Akun Renunganku</title>
        <style type="text/css">
          body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
          a { text-decoration: none; }
          
          /* Mobile Responsive */
          @media only screen and (max-width: 600px) {
            .wrapper { width: 100% !important; }
            .content { width: 100% !important; padding: 20px !important; }
            .logo { font-size: 18px !important; padding: 10px 20px !important; }
            .heading { font-size: 24px !important; }
            .otp-cell { padding: 0 3px !important; }
            .otp-box { width: 36px !important; height: 44px !important; font-size: 18px !important; }
            .btn { padding: 14px 24px !important; font-size: 15px !important; }
            .hide-mobile { display: none !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        
        <!-- Preheader (hidden text for email preview) -->
        <div style="display: none; max-height: 0px; overflow: hidden;">
          Kode verifikasi Anda: ${otp} • Berlaku selama 15 menit
        </div>

        <!-- Main Wrapper Table -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F9FAFB;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              
              <!-- Container Table (600px) -->
              <table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
                
                <!-- Logo/Brand Header -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="logo" align="center" style="background-color: #6366F1; padding: 12px 28px; border-radius: 12px;">
                          <span style="margin: 0; font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                            ✨ Renunganku
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main Content Card -->
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E5E7EB;">
                      
                      <!-- Top Accent Bar -->
                      <tr>
                        <td style="height: 4px; background-color: #6366F1; border-radius: 16px 16px 0 0;"></td>
                      </tr>

                      <!-- Content Padding -->
                      <tr>
                        <td class="content" style="padding: 40px 32px;">
                          
                          <!-- Icon -->
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-bottom: 24px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="64" height="64" style="background-color: #EEF2FF; border-radius: 16px;">
                                  <tr>
                                    <td align="center" valign="middle" style="font-size: 32px; line-height: 64px;">
                                      🔐
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <!-- Heading -->
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <h2 class="heading" style="margin: 0; font-size: 28px; font-weight: 700; color: #111827; line-height: 1.3; letter-spacing: -0.5px;">
                                  Verifikasi Akun Anda
                                </h2>
                              </td>
                            </tr>
                          </table>

                          <!-- Description -->
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-bottom: 28px;">
                                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #6B7280;">
                                  Terima kasih telah mendaftar di <strong style="color: #111827;">Renunganku</strong>! Untuk mengaktifkan akun Anda, gunakan kode verifikasi di bawah ini atau klik tombol verifikasi.
                                </p>
                              </td>
                            </tr>
                          </table>

                          <!-- OTP Box Container -->
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                            <tr>
                              <td style="background-color: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 12px; padding: 24px 20px;">
                                
                                <!-- Label -->
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td align="center" style="padding-bottom: 16px;">
                                      <p style="margin: 0; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                                        Kode Verifikasi
                                      </p>
                                    </td>
                                  </tr>
                                </table>

                                <!-- OTP Boxes (Table-based) -->
                                <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    ${otp
                                      .split('')
                                      .map(
                                        (char) => `
                                      <td class="otp-cell" style="padding: 0 6px;">
                                        <table cellpadding="0" cellspacing="0" border="0" width="44" height="48" class="otp-box" style="background-color: #FFFFFF; border: 2px solid #6366F1; border-radius: 10px;">
                                          <tr>
                                            <td align="center" valign="middle" style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 700; color: #111827; line-height: 48px;">
                                              ${char}
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    `,
                                      )
                                      .join('')}
                                  </tr>
                                </table>

                                <!-- Expiry Note -->
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td align="center" style="padding-top: 16px;">
                                      <p style="margin: 0; font-size: 13px; color: #9CA3AF; line-height: 1.5;">
                                        Kode berlaku selama <strong style="color: #6366F1;">15 menit</strong>
                                      </p>
                                    </td>
                                  </tr>
                                </table>

                              </td>
                            </tr>
                          </table>

                          <!-- CTA Button -->
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
                            <tr>
                              <td align="center">
                                <!--[if mso]>
                                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${verificationLink}" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="23%" stroke="f" fillcolor="#6366F1">
                                  <w:anchorlock/>
                                  <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Verifikasi Akun Sekarang</center>
                                </v:roundrect>
                                <![endif]-->
                                <!--[if !mso]><!-->
                                <a href="${verificationLink}" class="btn" style="display: inline-block; background-color: #6366F1; color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                  Verifikasi Akun Sekarang
                                </a>
                                <!--<![endif]-->
                              </td>
                            </tr>
                          </table>

                          <!-- Divider -->
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 20px 0;">
                            <tr>
                              <td style="border-top: 1px solid #E5E7EB;"></td>
                            </tr>
                          </table>

                          <!-- Alternative Link -->
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-bottom: 8px;">
                                <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.5;">
                                  Atau salin dan tempel link berikut ke browser Anda:
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <p style="margin: 0; font-size: 13px; word-break: break-all;">
                                  <a href="${verificationLink}" style="color: #6366F1; text-decoration: underline;">
                                    ${verificationLink}
                                  </a>
                                </p>
                              </td>
                            </tr>
                          </table>

                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Security Notice -->
                <tr>
                  <td style="padding-top: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 12px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0; font-size: 13px; color: #92400E; line-height: 1.6;">
                            <strong style="display: block; margin-bottom: 4px;">🔒 Tips Keamanan:</strong>
                            Jangan bagikan kode ini kepada siapa pun, termasuk tim Renunganku. Kami tidak akan pernah meminta kode verifikasi Anda.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding-top: 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      
                      <!-- Disclaimer -->
                      <tr>
                        <td align="center" style="padding-bottom: 16px;">
                          <p style="margin: 0; font-size: 13px; color: #9CA3AF; line-height: 1.6;">
                            Email ini dikirim otomatis. Jika Anda tidak mendaftar ke Renunganku,<br class="hide-mobile">
                            Anda dapat mengabaikan email ini dengan aman.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer Links -->
                      <tr>
                        <td align="center" style="padding-bottom: 16px;">
                          <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding: 0 8px;">
                                <a href="${websiteUrl}" style="color: #6B7280; text-decoration: none; font-size: 13px; font-weight: 500;">
                                  Website
                                </a>
                              </td>
                              <td style="padding: 0 4px; color: #D1D5DB; font-size: 13px;">•</td>
                              <td style="padding: 0 8px;">
                                <a href="mailto:${supportEmail}" style="color: #6B7280; text-decoration: none; font-size: 13px; font-weight: 500;">
                                  Bantuan
                                </a>
                              </td>
                              <td style="padding: 0 4px; color: #D1D5DB; font-size: 13px;">•</td>
                              <td style="padding: 0 8px;">
                                <a href="${privacyUrl}" style="color: #6B7280; text-decoration: none; font-size: 13px; font-weight: 500;">
                                  Privasi
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Copyright -->
                      <tr>
                        <td align="center">
                          <p style="margin: 0; font-size: 12px; color: #D1D5DB;">
                            © 2025 Renunganku. All rights reserved.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
      </html>
    `;

    await this.resendService.send({
      from: resendFrom,
      to: email,
      subject: '🔐 Verifikasi Email Anda - Renunganku',
      html,
      text: `
Verifikasi Akun Renunganku

Kode Verifikasi Anda: ${otp}

Gunakan kode di atas atau klik link berikut untuk memverifikasi akun Anda:
${verificationLink}

Kode berlaku selama 15 menit.

Jika Anda tidak mendaftar ke Renunganku, abaikan email ini.

---
© 2025 Renunganku
Website: ${websiteUrl}
Support: ${supportEmail}
      `.trim(),
    });
  }

  async sendPasswordResetEmail(email: string, otp: string) {
    const supportEmail = this.getSupportEmail();
    const resendFrom = this.getResendFrom();

    const html = `
      <!doctype html>
      <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Reset Password Renunganku</title>
      </head>
      <body style="margin:0;padding:0;background-color:#F9FAFB;font-family:'Inter','Segoe UI',sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F9FAFB;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width:560px;background:#FFFFFF;border-radius:20px;border:1px solid #E5E7EB;padding:32px;">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="display:inline-flex;align-items:center;gap:8px;font-size:20px;font-weight:700;color:#6366F1;">
                      ✨ Renunganku
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h1 style="margin:0 0 12px;font-size:24px;">Permintaan Reset Password</h1>
                    <p style="margin:0 0 16px;font-size:15px;color:#4B5563;">Kami menerima permintaan untuk mengatur ulang password akun Anda. Gunakan kode berikut untuk melanjutkan proses reset password. Kode berlaku selama 15 menit.</p>
                    <table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:24px auto;">
                      <tr>
                        ${otp
                          .split('')
                          .map(
                            (char) => `
                              <td style="padding:0 6px;">
                                <div style="width:46px;height:54px;border:2px solid #6366F1;border-radius:12px;font-size:20px;font-weight:700;display:flex;align-items:center;justify-content:center;">
                                  ${char}
                                </div>
                              </td>
                            `,
                          )
                          .join('')}
                      </tr>
                    </table>
                    <p style="margin:0 0 12px;font-size:14px;color:#6B7280;">Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.</p>
                    <table role="presentation" width="100%" style="margin-top:24px;background:#FEF3C7;border-radius:12px;border:1px solid #FDE68A;">
                      <tr>
                        <td style="padding:16px;font-size:13px;color:#92400E;">
                          Jangan bagikan kode ini kepada siapa pun. Tim Renunganku tidak akan pernah meminta kode OTP Anda.
                        </td>
                      </tr>
                    </table>
                    <p style="margin:32px 0 0;font-size:12px;color:#9CA3AF;text-align:center;">© ${new Date().getFullYear()} Renunganku • ${supportEmail}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.resendService.send({
      from: resendFrom,
      to: email,
      subject: '🔑 Kode Reset Password Renunganku',
      html,
      text: `
Kode reset password Anda: ${otp}

Kode berlaku selama 15 menit. Jangan bagikan kode ini kepada siapa pun.

Jika Anda tidak meminta reset password, abaikan email ini.
      `.trim(),
    });
  }

  async sendSuspiciousActivityEmail(email: string, namaLengkap: string) {
    const supportEmail = this.getSupportEmail();
    const resendFrom = this.getResendFrom();

    const html = `
      <!doctype html>
      <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Peringatan Aktivitas Mencurigakan</title>
      </head>
      <body style="margin:0;padding:0;background-color:#0F172A;font-family:'Inter','Segoe UI',sans-serif;color:#E5E7EB;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#020617;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width:560px;background:#020617;border-radius:24px;border:1px solid #1E293B;padding:28px 24px;box-shadow:0 24px 60px rgba(15,23,42,0.9);">
                <tr>
                  <td align="left" style="padding-bottom:20px;">
                    <div style="display:inline-flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:#E5E7EB;">
                      ✨ Renunganku
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:20px;border-radius:18px;background:radial-gradient(circle at top,#22C55E33,#0F172A),radial-gradient(circle at bottom,#F9731633,#020617);border:1px solid #0F172A;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:24px 20px;">
                          <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.12em;">Notifikasi Keamanan</p>
                          <h1 style="margin:0 0 8px;font-size:22px;color:#F9FAFB;">Laporan aktivitas mencurigakan diterima</h1>
                          <p style="margin:0;font-size:14px;color:#CBD5F5;">Halo ${namaLengkap || 'Sahabat Renunganku'}, kami mencatat bahwa kamu baru saja melaporkan aktivitas mencurigakan pada akunmu.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:8px;padding-bottom:16px;">
                    <p style="margin:0 0 10px;font-size:14px;color:#E5E7EB;">Langkah yang kami sarankan:</p>
                    <ul style="margin:0 0 12px 18px;padding:0;font-size:13px;color:#9CA3AF;">
                      <li>Segera ganti password dari halaman Pengaturan &gt; Kredensial &amp; Password.</li>
                      <li>Periksa daftar perangkat &amp; sesi aktif lalu putuskan perangkat yang tidak dikenali.</li>
                      <li>Waspadai email atau pesan yang meminta kode OTP atau password.</li>
                    </ul>
                    <p style="margin:0;font-size:13px;color:#6B7280;">Tim kami menerima sinyal ini dan akan memonitor jika ada pola login yang tidak biasa. Jika kamu merasa akunmu diambil alih, segera reset password dan hubungi support.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;border-top:1px solid #1E293B;">
                    <p style="margin:12px 0 0;font-size:11px;color:#6B7280;text-align:center;">Email ini dikirim ke ${email}. Jika kamu tidak merasa mengirim laporan ini, abaikan email ini.</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#4B5563;text-align:center;">© ${new Date().getFullYear()} Renunganku • ${supportEmail}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.resendService.send({
      from: resendFrom,
      to: email,
      subject: '🚨 Laporan Aktivitas Mencurigakan di Akun Renunganku',
      html,
      text: `
Kami menerima laporan aktivitas mencurigakan pada akun Renunganku Anda.

Langkah yang disarankan:
- Segera ganti password dari halaman Pengaturan.
- Putuskan perangkat atau sesi yang tidak dikenali.
- Jangan pernah membagikan kode OTP atau password ke siapa pun.

Jika Anda merasa akun diambil alih, segera ubah password dan hubungi support.

--
Renunganku Security
      `.trim(),
    });
  }
}

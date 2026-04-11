const YEAR = new Date().getFullYear();

export function emailBase({
  title,
  preheader,
  body,
  baseUrl,
}: {
  title: string;
  preheader: string;
  body: string;
  baseUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <!-- preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- wordmark -->
        <tr>
          <td style="padding:0 0 24px 0;text-align:center;">
            <span style="font-size:18px;font-weight:700;color:#18181b;letter-spacing:-0.3px;">Soplantila</span>
          </td>
        </tr>

        <!-- card -->
        <tr>
          <td style="background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;padding:40px 40px 32px;">
            ${body}
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:24px 0;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">
              © ${YEAR} Soplantila &nbsp;·&nbsp;
              <a href="${baseUrl}/privacy" style="color:#a1a1aa;text-decoration:none;">Privasi</a>
              &nbsp;·&nbsp;
              <a href="${baseUrl}/terms" style="color:#a1a1aa;text-decoration:none;">Ketentuan</a>
            </p>
            <p style="margin:0;font-size:11px;color:#d4d4d8;">Ruang refleksi digital yang tenang</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function btn(text: string, href: string, color = '#18181b'): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
    <tr>
      <td style="background:${color};border-radius:6px;">
        <a href="${href}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

export function infoBox(rows: [string, string][]): string {
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 0;font-size:13px;color:#71717a;width:120px;vertical-align:top;">${label}</td>
          <td style="padding:8px 0;font-size:13px;color:#18181b;font-weight:500;">${value}</td>
        </tr>`,
    )
    .join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:6px;padding:16px 20px;margin:20px 0;">${cells}</table>`;
}

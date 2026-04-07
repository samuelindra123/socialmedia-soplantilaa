# Environment Variables untuk Vercel

Tambahkan semua variabel ini di Vercel Dashboard → Project → Settings → Environment Variables.

## Required

| Variable | Contoh | Keterangan |
|----------|--------|------------|
| `NEXT_PUBLIC_API_URL` | `https://api.soplantila.com` | URL backend publik |
| `NEXT_PUBLIC_APP_URL` | `https://soplantila.com` | URL frontend production |
| `NEXT_PUBLIC_ASSET_BASE_URL` | `https://api.soplantila.com` | URL untuk assets |
| `BACKEND_API_URL` | `https://api.soplantila.com` | URL backend (server-side) |
| `BASE_URL` | `https://soplantila.com` | Base URL frontend |
| `NEXT_SERVER_ACTION_API_TOKEN` | `random-secret-panjang-min-32-char` | Token internal API (harus sama dengan backend) |

## Cara Generate Token

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Catatan Vercel Free Plan

- **Serverless Functions**: 100GB-Hrs/bulan
- **Edge Functions**: Unlimited invocations (pakai ini untuk proxy)
- **Bandwidth**: 100GB/bulan
- **Build**: 6000 menit/bulan
- **Image Optimization**: 1000 source images/bulan

## Tips Hemat Kuota

1. Proxy route sudah pakai **Edge Runtime** (lebih hemat dari Node.js)
2. Static marketing pages tidak pakai serverless function
3. Image cache TTL 30 hari (kurangi request ke Vercel image optimizer)
4. Server Actions tetap berjalan normal di Vercel

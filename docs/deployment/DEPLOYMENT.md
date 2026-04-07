# Deployment Guide – Renunganku (NestJS + Next.js)

Dokumen ini merangkum apa saja yang perlu disiapkan untuk **deployment production** backend NestJS dan frontend Next.js di project Renunganku.

---

## 1. Arsitektur Tinggi

- **Backend API**: NestJS di port internal `4000`, di-*expose* sebagai `https://api.renunganku.com`.
- **Frontend Web**: Next.js App Router di port internal `3000`, di-*expose* sebagai `https://app.renunganku.com`.
- **Database**: PostgreSQL (mis. Supabase / RDS / instance sendiri).
- **Reverse Proxy & HTTPS**: Nginx / Caddy / Traefik di depan keduanya.

Minimal bisa jalan di **1 VM** (backend + frontend + reverse proxy) atau dipisah menjadi 2 service.

---

## 2. Backend – NestJS (folder `apps/backend/`)

### 2.1. Prasyarat

- Node.js LTS (20.x direkomendasikan).
- Akses database PostgreSQL production.
- `npm` atau `yarn` terpasang.

### 2.2. Environment Variables Production

Buat file `.env` di folder `apps/backend/` (atau `.env.production` jika memakai proses build khusus), dengan nilai **production** (jangan pakai kredensial dev). Contoh struktur:

```env
# Database
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:5432/<DB_NAME>"
DATABASE_URL_POOLING="postgresql://<USER>:<PASSWORD>@<HOST>:6543/<DB_NAME>"

# Resend (email)
RESEND_API_KEY="re_prod_xxxxxxxxxxxxxxxxxxxxx"

# Storage (DigitalOcean Spaces / S3)
DO_SPACES_KEY="PROD_SPACES_KEY"
DO_SPACES_SECRET="PROD_SPACES_SECRET"
DO_SPACES_ENDPOINT="sgp1.digitaloceanspaces.com"
DO_SPACES_BUCKET="renunganku"
DO_SPACES_CDN="renunganku.sgp1.cdn.digitaloceanspaces.com"

# JWT
JWT_SECRET="prod-super-secret-key-yang-kuat"
JWT_EXPIRATION="7d"

# URLs
API_URL="https://api.renunganku.com"
FRONTEND_URL="https://app.renunganku.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-prod-google-client-id"
GOOGLE_CLIENT_SECRET="your-prod-google-client-secret"
GOOGLE_OAUTH_REDIRECT="https://api.renunganku.com/auth/google/callback"

NODE_ENV=production
PORT=4000
```

> Penting: `DATABASE_URL` dan `DATABASE_URL_POOLING` harus menunjuk ke DB production yang sama dengan yang dipakai admin panel.

### 2.3. Build & Migrate

Di server, dari folder `apps/backend/`:

```bash
# Install dependencies
npm install

# Jalankan migrasi Prisma ke database production
npx prisma migrate deploy

# Build NestJS ke folder dist
npm run build
```

### 2.4. Menjalankan Backend (Production)

Tanpa process manager (untuk uji cepat):

```bash
NODE_ENV=production PORT=4000 node dist/main.js
```

Dengan `pm2` (direkomendasikan):

```bash
pm2 start dist/main.js --name renunganku-backend --env production
pm2 save
```

Jika memakai Docker, prinsipnya sama: pastikan image menjalankan `npm run build` di build stage dan `node dist/main.js` di runtime stage.

### 2.5. Catatan Production

- **CORS**: di `main.ts`, `FRONTEND_URL` digunakan untuk mengizinkan origin tertentu. Pastikan nilainya domain frontend production.
- **Swagger**: pertimbangkan untuk mematikan atau mengamankan `/api-docs` di production.
- **Logging**: kurangi `console.log` yang tidak perlu; gunakan log level yang lebih ketat di production.

---

## 3. Frontend – Next.js (folder `apps/frontend/`)

### 3.1. Prasyarat

- Node.js LTS (20.x).
- Akses ke API production (`https://api.renunganku.com`).

### 3.2. Environment Variables Production

Buat `.env.production` atau `.env` di folder `apps/frontend/` (diatur sesuai platform deployment):

```env
NEXT_PUBLIC_API_URL="https://api.renunganku.com"
NEXT_PUBLIC_WS_URL="wss://api.renunganku.com"  # jika websocket dipakai
NODE_ENV=production
```

`NEXT_PUBLIC_API_URL` wajib mengarah ke URL publik backend NestJS.

### 3.3. Build & Run Next.js

Di server, dari folder `apps/frontend/`:

```bash
# Install dependencies
npm install

# Build production
npm run build

# Jalankan server Next.js
npm start   # alias untuk `next start`
# default port: 3000 (bisa diubah dengan PORT=3000)
```

Untuk menjaga proses tetap hidup, jalankan via `pm2` atau sistem manager lain:

```bash
pm2 start npm --name renunganku-frontend -- start
pm2 save
```

### 3.4. Pengaturan Khusus

- **Image/domain**: jika memuat gambar dari CDN (Spaces/S3), tambahkan domain CDN di `next.config.ts` pada bagian `images.domains` (jika digunakan).
- **Caching data**:
  - Gunakan `cache: "no-store"` untuk data yang harus selalu realtime (feed sosial, status sistem, dll).
  - Gunakan `revalidate` untuk halaman yang boleh di-cache (blog, fitur landing, dsb).

---

## 4. Reverse Proxy & HTTPS (Contoh Nginx)

Contoh konsep konfigurasi (bukan file lengkap):

```nginx
server {
  listen 80;
  server_name api.renunganku.com;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 80;
  server_name app.renunganku.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Tambahkan konfigurasi HTTPS (Let’s Encrypt / sertifikat lain) sesuai kebutuhan.

---

## 5. Checklist Deployment Singkat

1. **Database**
   - [ ] Sudah membuat DB production (PostgreSQL) dan mengisi `DATABASE_URL` / `DATABASE_URL_POOLING`.
   - [ ] `npx prisma migrate deploy` berjalan tanpa error.

2. **Backend (NestJS)**
   - [ ] `.env` production terisi lengkap (JWT, email, storage, URLs, Google OAuth).
   - [ ] `npm run build` sukses.
   - [ ] `node dist/main.js` atau `pm2 start dist/main.js` berjalan dan bisa diakses di port internal (4000).

3. **Frontend (Next.js)**
   - [ ] `.env` production berisi `NEXT_PUBLIC_API_URL` yang mengarah ke backend production.
   - [ ] `npm run build` sukses.
   - [ ] `npm start` atau `pm2 start npm -- start` berjalan dan bisa diakses di port internal (3000).

4. **Reverse Proxy & HTTPS**
   - [ ] Domain `api.renunganku.com` mengarah ke backend.
   - [ ] Domain `app.renunganku.com` mengarah ke frontend.
   - [ ] HTTPS aktif dan sertifikat valid.

5. **Smoke Test**
   - [ ] Bisa login/signup di `app.renunganku.com`.
   - [ ] Feed & halaman sosial berjalan.
   - [ ] Blog, halaman fitur, dan system status menampilkan data dari backend.
   - [ ] Tidak ada CORS error di console browser.

---

Untuk detail arsitektur video, instant preview, dan modul lain, lihat file lain di folder `docs/` (misalnya `INSTANT_VIDEO_PREVIEW_ARCHITECTURE.md`, `FRONTEND_INSTANT_PREVIEW_MIGRATION.md`, dll).

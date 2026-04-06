# Renunganku – Platform Refleksi Digital

Renunganku adalah platform sosial yang dirancang sebagai **ruang digital yang tenang** untuk refleksi diri: tanpa kebisingan notifikasi berlebihan, tanpa tekanan angka, dan dengan pengalaman menulis/jurnal yang fokus.

Repositori ini berisi:

- **Backend** – API sosial berbasis NestJS + PostgreSQL + Prisma.
- **Frontend** – Aplikasi web modern berbasis Next.js (App Router) dengan UI hero, feed sosial, blog, dan halaman marketing.

---

## Fitur Utama (Preview)

### Frontend (Next.js)

- **Landing page modern**
  - Hero section dengan mockup aplikasi (desktop + mobile) dan animasi feed.
  - Halaman fitur (`/features`) yang menjelaskan fitur sosial (feed, discover, pesan, komunitas, profil, keamanan, dll).
- **Mode sosial**
  - Feed refleksi, profil pengguna, notifikasi, pesan, dan navigasi mobile.
- **Autentikasi & OAuth**
  - Flow login/signup dengan tombol Google dan UI yang konsisten.
- **System status widget**
  - Indikator “All systems normal” di footer yang bisa diklik untuk melihat status sistem (latency API, database, uptime) secara realtime.
- **Blog / Journal publik (`/blog`)**
  - Listing artikel yang ditarik dari backend (`GET /blog`).
  - Halaman detail artikel (`/blog/[slug]`) dengan konten markdown (ReactMarkdown).

### Backend (NestJS)

- **API sosial lengkap** (auth, onboarding, users, posts, comments, likes, follow, notifications, messages, stories, videos, alkitab module, dll).
- **Blog module**
  - `GET /blog` – daftar artikel publik (status PUBLISHED + SCHEDULED yang waktunya sudah lewat).
  - `GET /blog/:slug` – detail artikel berdasarkan slug.
- **System status endpoint**
  - `GET /system-status` – memeriksa latency API dan kesehatan koneksi database (digunakan oleh footer di frontend).
- **Prisma + PostgreSQL**
  - Skema `BlogPost` dan modul-modul sosial lain.

---

## Struktur Proyek

```text
apps/
  backend/   # NestJS API (src/, prisma/, test/)
  frontend/  # Next.js App Router frontend (src/app, components, store, dll)
             # route groups: (marketing), (auth), (social)
docs/      # Dokumentasi arsitektur & deployment
admin/     # Backend/admin terpisah (mis. Rust admin panel)
```

---

## Menjalankan Secara Lokal (Development)

### 1. Backend (NestJS)

```bash
cd apps/backend
npm install

# Pastikan DATABASE_URL di apps/backend/.env menunjuk ke DB dev
# NEXT_SERVER_ACTION_API_TOKEN harus diisi dan sama dengan apps/frontend/.env.local
npx prisma migrate deploy   # atau prisma db push untuk dev

npm run start:dev
# Backend jalan di http://localhost:4000
```

### 2. Frontend (Next.js)

```bash
cd apps/frontend
npm install

# Siapkan env frontend (lihat apps/frontend/.env.local.example)
# NEXT_PUBLIC_API_URL=http://localhost:4000
# BACKEND_API_URL=http://localhost:4000
# NEXT_SERVER_ACTION_API_TOKEN=<token-random-panjang>
# (harus sama dengan apps/backend/.env -> NEXT_SERVER_ACTION_API_TOKEN)

npm run dev
# Frontend jalan di http://localhost:3000
```

### 3. Konfigurasi Google OAuth (Frontend + Backend)

Isi env backend berikut:

```dotenv
GOOGLE_CLIENT_ID="<google-client-id>"
GOOGLE_CLIENT_SECRET="<google-client-secret>"
GOOGLE_OAUTH_REDIRECT="http://localhost:4000/auth/google/callback"
GOOGLE_OAUTH_STATE_SECRET="<random-secret-panjang>"
```

Di Google Cloud Console (OAuth 2.0 Client ID), isi:

- Authorized JavaScript origins (local):
  - `http://localhost:3000`
- Authorized redirect URIs (local):
  - `http://localhost:4000/auth/google/callback`

Untuk production, tambahkan domain production Anda:

- Authorized JavaScript origins (production):
  - `https://renunganku.peakcenter.tech` (atau domain frontend production Anda)
- Authorized redirect URIs (production):
  - `https://api.domain-anda.com/auth/google/callback` (harus persis sama dengan `GOOGLE_OAUTH_REDIRECT`)

Catatan penting:

- `GOOGLE_OAUTH_REDIRECT` wajib persis sama dengan salah satu nilai di Authorized redirect URIs.
- `GOOGLE_OAUTH_STATE_SECRET` dipakai untuk menandatangani parameter state OAuth agar tidak bisa ditamper.

Catatan keamanan frontend:

- Alur auth utama (login, signup, verify, forgot password, oauth confirm) sudah dipindahkan ke Server Action.
- Request HTTP dari client axios sekarang lewat route server internal (`/api/proxy/*`) sebelum diteruskan ke backend.
- Backend sekarang mewajibkan header internal token (`x-internal-api-token`) untuk request HTTP API, sehingga panggilan langsung dari browser ke backend akan ditolak.
- Koneksi socket realtime kini bisa menggunakan cookie auth HttpOnly (fallback), sehingga tidak lagi wajib membaca token akses dari localStorage.

---

## Deployment (Production)

Untuk panduan deployment lengkap (NestJS + Next.js + PostgreSQL + reverse proxy), lihat:

- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)

Dokumen tersebut menjelaskan:

- Environment variables yang perlu disiapkan (backend & frontend).
- Langkah build & run NestJS dan Next.js di production.
- Contoh konfigurasi reverse proxy (Nginx) dan checklist sebelum go‑live.

---

## Catatan

- Jangan commit kredensial sensitif (DATABASE_URL, API key, secret) ke repository publik.
- Untuk eksperimen lokal, gunakan `.env.local` / `.env.development` yang tidak ikut di-commit.

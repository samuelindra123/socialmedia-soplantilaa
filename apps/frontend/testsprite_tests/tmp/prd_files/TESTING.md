# Rencana Testing Frontend dan Status Cakupan

## Alat & Setup
- Framework: `Next.js` (app router)
- E2E: `@playwright/test` dengan `playwright.config.ts`
- Mock jaringan: `page.route` untuk endpoint API
- Jalankan lokal: `npm run dev` pada `http://127.0.0.1:3000`

## Menjalankan Tes
- Instal dependensi: `npm i`
- Instal browser Playwright: `npx playwright install`
- Jalankan semua tes: `npx playwright test`
- Mode debug/GUI: `npx playwright test --headed`
- Laporan: `npx playwright show-report`
- Base URL: gunakan `BASE_URL` bila perlu, default `http://127.0.0.1:3000` (lihat `playwright.config.ts`)

## Struktur Saat Ini
- Direktori tes: `frontend/tests`
- Konfigurasi: `frontend/playwright.config.ts`
- Tes tersedia: `frontend/tests/e2e-like.spec.ts` (uji tombol Like, stabilitas UI)

## Peta Fitur Utama yang Perlu Diuji
- Autentikasi
  - Login: halaman `src/app/login/page.tsx`
  - Signup: `src/app/signup/page.tsx`
  - Verify email: `src/app/verify/page.tsx`
  - Forgot password: `src/app/forgot-password/page.tsx`
  - Middleware redirect: `src/middleware.ts`
- Feed & Interaksi Post
  - Like/Unlike: `src/components/feed/PostCard.tsx:352` (handler), `:308` (mutasi)
  - Daftar likes (modal): `src/components/feed/PostCard.tsx:852` dengan query `post-likes`
  - Komentar: kirim komentar `:384`, balasan `:404`, like komentar `:425`
  - Edit/Hapus post: update `:457`, delete `:483`
  - Share modal: `:917`
  - Media play/mute: `:224` dan `:235`
  - Explore card rendering: konteks `explore` `:500`–`:621`
- Follow/Unfollow
  - Komponen `FollowButton`: cek status `:72`, mutasi follow/unfollow `:88`
- Discover/Explore
  - Halaman: `src/app/discover/page.tsx`, `src/app/explore/page.tsx`
  - Infinite/segmented data: invalidasi cache di like/follow
- Profil
  - Header/Tabs: `src/components/profile/*`, halaman `src/app/profile/[username]/page.tsx`
- Onboarding & Settings
  - Onboarding: `src/app/onboarding/page.tsx`
  - Settings: `src/app/settings/page.tsx`
- Halaman statik (konten)
  - `cookies`, `terms`, `privacy`, `pricing`, `features`, `blog`, `manifesto`, `roadmap`, `changelog`

## Matriks Mock API untuk Tes
- Feed: `GET /posts/feed?mode=following`
- Like post: `POST /likes/posts/:postId`, `DELETE /likes/posts/:postId`
- Daftar likes: `GET /posts/:postId/likes`
- Komentar: `GET/POST /comments/posts/:postId`
- Like komentar: `POST/DELETE /comments/likes/:commentId`
- Follow: `GET /follow/check/:username`, `POST/DELETE /follow/:username`
- Update/Hapus post: `PUT/DELETE /posts/:postId`

## Cakupan Tes Saat Ini
- Tersedia
  - Like tombol di feed, perubahan teks jumlah likes, stabilitas layout (bound box) pada satu kartu
- Belum Ada
  - Autentikasi end-to-end (login, signup, verify, forgot)
  - Flow komentar: kirim komentar, balas, like komentar, validasi kosong
  - Likes modal: daftar pengguna, tombol follow di modal
  - Share link: salin clipboard
  - Edit/Hapus post: modal, pemutakhiran cache
  - Media: play/pause video, mute/unmute, tampilan gambar
  - Follow/Unfollow: status, optimistic update, rollback error
  - Explore/Discover: render list, navigasi profil, tautan tags
  - Profil: render tabs, jumlah post, tombol follow
  - Onboarding/Settings: navigasi, guard akses
  - Halaman statik: render konten, link bekerja

## Rekomendasi Urutan Implementasi Tes
- Prioritas Tinggi (fungsi inti & risiko tinggi)
  - Autentikasi: `tests/auth-login.spec.ts`, `tests/auth-signup.spec.ts`
  - Feed Like & Komentar: `tests/feed-comments.spec.ts`, `tests/feed-likes-modal.spec.ts`
  - Follow/Unfollow: `tests/follow.spec.ts`
- Prioritas Menengah
  - Edit/Hapus post: `tests/post-edit-delete.spec.ts`
  - Share: `tests/share.spec.ts`
  - Media playback: `tests/media.spec.ts`
- Prioritas Rendah
  - Halaman statik: `tests/static-pages.spec.ts`
  - Onboarding/Settings: `tests/onboarding-settings.spec.ts`

## Panduan Penulisan Tes (Playwright)
- Contoh pola mock jaringan untuk konsistensi:
```ts
// Di awal testcase
await page.addInitScript(() => {
  localStorage.setItem('auth_token', 'test-token');
});
await page.route('**/posts/feed?mode=following', (route) => {
  route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } }) });
});
```
- Selektor yang konsisten
  - Gunakan label ARIA di tombol `Like`: atribut `aria-label` di `PostCard.tsx:731`–`:736`
  - Gunakan teks tombol untuk aksi (mis. `Kirim` di panel komentar)
- Stabilitas UI
  - Verifikasi perubahan jumlah likes tidak mengubah dimensi kartu (contoh tersedia di `e2e-like.spec.ts`)

## Kriteria Keberhasilan per Fitur
- Like/Unlike
  - Klik tombol mengganti state ikon dan mengubah jumlah likes ±1 tanpa error
- Komentar
  - Kirim komentar valid menambah item baru; komentar kosong menampilkan toast error
  - Balas komentar muncul di bawah komentar target; like komentar menambah/mengurangi counter
- Likes Modal
  - Daftar pengguna terisi, tombol follow tersedia untuk non-diri
- Follow/Unfollow
  - Optimistic update menyesuaikan label tombol; rollback bila API gagal menampilkan pesan error
- Edit/Hapus
  - Modal terbuka, submit memperbarui konten/judul/tags; hapus menginvalidasi list
- Media
  - Play/pause dan mute/unmute bekerja, tombol terlihat sesuai state
- Autentikasi
  - Login sukses mengarahkan ke feed; 401 memaksa redirect ke `/login`

## Pelaporan & Pemeliharaan
- Simpan laporan: `npx playwright show-report`
- Tambahkan ke CI: jalankan `npx playwright test` pada setiap push PR
- Gunakan `page.route` untuk memisahkan tes dari backend dan menghindari flaky

## Ringkasan
- Saat ini cakupan tes terbatas pada like di feed.
- Dibutuhkan suite komprehensif untuk autentikasi, komentar, follow, edit/hapus, share, media, dan halaman.
- Dokumen ini menjadi acuan implementasi bertahap beserta nama file spesifikasi yang disarankan.

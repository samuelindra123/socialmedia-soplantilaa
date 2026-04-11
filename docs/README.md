# 📚 Dokumentasi Soplantila

Semua dokumentasi teknis dan panduan pengembangan platform Soplantila.

---

## 📁 Struktur Folder

```
docs/
├── auth/          # Autentikasi, redesign halaman, bug fixes
├── video/         # Arsitektur video, upload, processing, dan optimisasi
├── redis/         # Optimisasi Redis dan kesiapan production
├── performance/   # Catatan optimisasi performa dan skala
├── architecture/  # Catatan perbandingan arsitektur/stabilitas
├── security/      # Audit keamanan, laporan
├── email/         # Sistem email, template, panduan integrasi
└── deployment/    # Panduan deploy, konfigurasi production
```

---

## 🔐 Auth (`docs/auth/`)

| File | Deskripsi |
|------|-----------|
| `AUTH_BUGS_ANALYSIS.md` | Analisis 7 bug kritis yang ditemukan |
| `AUTH_FIXES_APPLIED.md` | Ringkasan semua fix yang diterapkan |
| `AUTH_FLOW_ANALYSIS.md` | Analisis alur autentikasi |
| `AUTH_FLOW_DIAGRAM.md` | Diagram visual alur auth |
| `AUTH_REDESIGN_TEMPLATE.md` | Template redesign halaman auth |
| `AUTH_AUDIT_REPORT.md` | Laporan audit lengkap |
| `REDESIGN_COMPLETE.md` | Status redesign 8 halaman auth |
| `REDESIGN_SUMMARY.md` | Ringkasan perubahan redesign |

---

## 📧 Email (`docs/email/`)

| File | Deskripsi |
|------|-----------|
| `EMAIL_SYSTEM_GUIDE.md` | Panduan lengkap implementasi email system |
| `EMAIL_SYSTEM_SUMMARY.md` | Ringkasan fitur email system |
| `FINAL_EMAIL_SUMMARY.md` | Summary final setelah simplifikasi |

---

## 🎬 Video (`docs/video/`)

| File | Deskripsi |
|------|-----------|
| `BACKEND_VIDEO_FIX.md` | Fix terkait backend untuk alur video |
| `CHUNK_BASED_VIDEO_ARCHITECTURE.md` | Arsitektur upload video berbasis chunk |
| `FINAL_SUMMARY_VIDEO_UPLOAD.md` | Ringkasan final implementasi upload video |
| `SCALING_40K_VIDEOS.md` | Catatan scaling untuk beban video besar |
| `VIDEO_FASTSTART_SUMMARY.md` | Ringkasan implementasi faststart |
| `VIDEO_FIX_SUMMARY.md` | Ringkasan perbaikan fitur video |
| `VIDEO_MERGE_OPTIMIZATION.md` | Optimisasi proses merge video |
| `VIDEO_OPTIMIZATION.md` | Panduan optimisasi video player |
| `VIDEO_PROCESSING_IMPLEMENTATION.md` | Implementasi teknis video processing |
| `VIDEO_PROCESSING_SETUP.md` | Panduan setup video processing |
| `VIDEO_UPLOAD_FACEBOOK_FLOW.md` | Dokumentasi alur upload ala Facebook |
| `VIDEO_UPLOAD_FIX.md` | Fix issue pada upload video |
| `VIDEO_UPLOAD_SETUP.md` | Quick start setup upload video |
| `MULTI_QUALITY_VIDEO_ARCHITECTURE.md` | Arsitektur multi-quality video (144p–1080p) |
| `VIDEO_PROCESSING_SUMMARY.md` | Ringkasan pipeline video processing |
| `INSTANT_VIDEO_PREVIEW_ARCHITECTURE.md` | Arsitektur instant preview video |
| `FRONTEND_INSTANT_PREVIEW_MIGRATION.md` | Migrasi frontend ke instant preview |
| `UPLOAD_PREVIEW_FEATURE_SUMMARY_DETAILED.md` | Detail fitur upload + preview |
| `VEO_VIDEO_SCRIPT.md` | Script video demo (Veo) |
| `VIDEO_DEMO_SCRIPT.md` | Script demo video platform |

---

## 🛡️ Security (`docs/security/`)

| File | Deskripsi |
|------|-----------|
| `SECURITY_AUDIT_COMPLETE.md` | Laporan audit keamanan lengkap |

---

## 🚀 Deployment (`docs/deployment/`)

| File | Deskripsi |
|------|-----------|
| `DEPLOYMENT.md` | Panduan deploy production (NestJS + Next.js + PostgreSQL) |
| `CONVERT_LOGO_TO_PNG.md` | Panduan konversi logo ke PNG |
| `SSH_KEEPALIVE_FIX.md` | Catatan fix kestabilan koneksi SSH |

---

## 🧠 Architecture (`docs/architecture/`)

| File | Deskripsi |
|------|-----------|
| `STABLE_VS_UNSTABLE.md` | Perbandingan pendekatan stabil vs tidak stabil |

---

## ⚡ Performance (`docs/performance/`)

| File | Deskripsi |
|------|-----------|
| `OPTIMIZED_500_USERS.md` | Catatan optimisasi untuk skenario 500 user |

---

## 🧰 Redis (`docs/redis/`)

| File | Deskripsi |
|------|-----------|
| `REDIS_OPTIMIZATION.md` | Strategi optimisasi Redis |
| `REDIS_PRODUCTION_READY.md` | Checklist Redis production-ready |

---

## 🔗 Quick Links

- [README Utama](../README.md)
- [Backend README](../apps/backend/README.md)
- [Frontend README](../apps/frontend/README.md)

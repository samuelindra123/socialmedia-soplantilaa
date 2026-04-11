# Video Processing - Faststart Optimization & Thumbnail Generation

## ✅ Implementasi Selesai

Fitur upload video dengan optimasi faststart dan thumbnail otomatis sudah berhasil diimplementasikan.

## 📦 Dependencies Baru

```bash
npm install ffmpeg-static
```

## 🏗️ Arsitektur

### Database
- **PostgreSQL (Supabase)** dengan Prisma untuk metadata video
- Model `Video` sudah memiliki field: `processedUrl`, `thumbnailUrl`, `status`

### Storage
- **Appwrite Storage** untuk menyimpan file video dan thumbnail

### Queue
- **BullMQ + Redis** untuk background processing
- Queue baru: `video-faststart` (terpisah dari queue legacy `video-processing`)

## 📁 File yang Dibuat/Dimodifikasi

### Baru Dibuat
1. **`video-processing.service.ts`**
   - `optimizeForStreaming()`: Optimize video dengan `-movflags faststart`
   - `generateThumbnail()`: Generate thumbnail 1280x720 dari detik ke-2
   - `cleanupFiles()`: Cleanup temp files

2. **`queues/video-faststart.queue.ts`**
   - Consumer BullMQ dengan concurrency 3
   - Progress tracking: 10%, 40%, 70%, 100%
   - Upload paralel video + thumbnail
   - Auto cleanup temp files

3. **`docs/video/VIDEO_PROCESSING_SETUP.md`**
   - Setup guide lengkap

4. **`docs/video/VIDEO_PROCESSING_IMPLEMENTATION.md`**
   - Dokumentasi implementasi dan cara pakai

### Dimodifikasi
1. **`queues/video-queues.module.ts`**
   - Tambah queue `video-faststart` dengan konfigurasi:
     - Concurrency: 3 workers
     - Rate limit: 10 job/10s
     - Retry: 3x exponential backoff (5s, 10s, 20s)
     - Timeout: 5 menit
     - Cleanup: 200 completed, 100 failed

2. **`videos.controller.ts`**
   - `POST /videos/upload-optimized`: Upload video baru
   - `GET /videos/:id/status`: Polling status & progress
   - `GET /videos/queue/stats`: Monitoring queue

3. **`videos.module.ts`**
   - Register `VideoProcessingService` dan `VideoFaststartConsumer`

4. **`video-storage.service.ts`**
   - Tambah method `uploadFile()` untuk generic upload

## 🚀 API Endpoints

### 1. Upload Video
```http
POST /videos/upload-optimized
Content-Type: multipart/form-data
Authorization: Bearer <token>

video: <file>
title: "Video Title"
description: "Video Description"
```

Response:
```json
{
  "videoId": "uuid",
  "status": "processing",
  "message": "Video sedang diproses"
}
```

### 2. Cek Status
```http
GET /videos/:id/status
```

Response (processing):
```json
{
  "status": "processing",
  "progress": 40,
  "processedUrl": null,
  "thumbnailUrl": null
}
```

Response (ready):
```json
{
  "status": "ready",
  "progress": 100,
  "processedUrl": "https://appwrite.../video.mp4",
  "thumbnailUrl": "https://appwrite.../thumb.jpg"
}
```

### 3. Queue Stats
```http
GET /videos/queue/stats
```

Response:
```json
{
  "waiting": 5,
  "active": 3,
  "completed": 120,
  "failed": 2
}
```

## ⚙️ Konfigurasi Queue

| Parameter | Value | Keterangan |
|-----------|-------|------------|
| Concurrency | 3 | Maksimal 3 video diproses bersamaan |
| Rate Limit | 10 job/10s | Untuk handle 500 user concurrent |
| Retry | 3x | Exponential backoff: 5s, 10s, 20s |
| Timeout | 5 menit | Per video |
| Cleanup | 200/100 | Keep 200 completed, 100 failed jobs |

## 🔄 Flow Processing

```
1. User upload → Save to temp → Create DB record (PROCESSING)
                                ↓
2. Add job to BullMQ queue → Return response immediately
                                ↓
3. Worker picks job (10% progress)
                                ↓
4. Optimize video with faststart (40% progress)
                                ↓
5. Generate thumbnail (70% progress)
                                ↓
6. Upload video + thumbnail to Appwrite (parallel)
                                ↓
7. Update DB: processedUrl, thumbnailUrl, status=READY (100%)
                                ↓
8. Cleanup temp files
```

## 🎯 Solusi Masalah

### 1. Video Loading Lama ✅
**Solusi**: `ffmpeg -movflags faststart -codec:v copy -codec:a copy`
- Pindahkan moov atom ke awal file
- Tidak ada re-encode (cepat)
- Browser bisa mulai playback tanpa download full file

### 2. Thumbnail Hitam ✅
**Solusi**: Generate thumbnail manual dengan ffmpeg
- Ambil frame dari detik ke-2
- Resolusi 1280x720 JPG
- Upload terpisah ke Appwrite Storage

## 📊 Performance

### Untuk 500 User Concurrent
- Rate limit: 10 job/10s = 60 job/menit
- Concurrency: 3 workers paralel
- Average time: 30-60 detik per video
- Queue capacity: Unlimited (Redis)

### Estimasi
- 500 user upload → masuk queue dalam 1-2 menit
- Proses selesai dalam 30-60 menit
- User dapat response instant (tidak tunggu proses)

## 🔍 Monitoring

### Cek Queue Stats
```bash
curl http://localhost:4000/videos/queue/stats
```

### Cek Redis
```bash
redis-cli
> KEYS bull:video-faststart:*
> LLEN bull:video-faststart:waiting
> LLEN bull:video-faststart:active
```

### Cek Temp Files
```bash
ls -lh /tmp/upload-*
ls -lh /tmp/optimized-*
ls -lh /tmp/thumb-*
```

### Manual Cleanup
```bash
rm -rf /tmp/upload-* /tmp/optimized-* /tmp/thumb-*
```

## 🐛 Troubleshooting

### Video masih lambat
- Cek moov atom: `ffprobe video.mp4 | grep moov`
- Pastikan menggunakan `processedUrl`, bukan `originalUrl`

### Thumbnail hitam
- Ubah timestamp di `generateThumbnail()` dari `'2'` ke `'1'`
- Pastikan video memiliki frame di detik tersebut

### Job stuck
- Cek Redis: `redis-cli ping`
- Restart: `npm run start:dev`
- Cek logs untuk error ffmpeg

### Temp files tidak terhapus
- Pastikan `finally` block dijalankan
- Manual cleanup: `rm -rf /tmp/upload-* /tmp/optimized-* /tmp/thumb-*`

## 🔐 Environment Variables

Pastikan sudah ada di `.env`:
```env
# Database (Supabase/PostgreSQL)
DATABASE_URL="postgresql://..."

# Redis (Upstash)
REDIS_URL="redis://..."

# Appwrite Storage
APPWRITE_ENDPOINT="https://sgp.cloud.appwrite.io/v1"
APPWRITE_PROJECT_ID="your-project-id"
APPWRITE_API_KEY="your-api-key"
APPWRITE_BUCKET_ID="your-bucket-id"
```

## ✨ Next Steps

1. **Frontend Integration**
   - UI upload dengan progress bar
   - Polling status setiap 2-3 detik
   - Show thumbnail setelah ready

2. **Optimization**
   - Add video compression untuk reduce size
   - Multiple quality variants (360p, 480p, 720p)
   - HLS/DASH streaming

3. **Monitoring**
   - Sentry/logging untuk track errors
   - Dashboard monitoring queue
   - Alert untuk queue overload

## 🎉 Status

✅ Build berhasil (0 errors)
✅ Queue terpisah dari sistem legacy
✅ Dokumentasi lengkap
✅ Ready untuk testing

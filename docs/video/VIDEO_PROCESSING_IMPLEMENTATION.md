# Video Processing Implementation Summary

## Masalah yang Diperbaiki

### 1. Video Loading Lama
**Root Cause**: moov atom (metadata MP4) ada di akhir file, browser harus download seluruh file sebelum bisa mulai playback.

**Solusi**: 
- Gunakan `ffmpeg -movflags faststart` untuk pindahkan moov atom ke awal file
- Tidak ada re-encode (menggunakan `-codec:v copy -codec:a copy`)
- Proses cepat karena hanya memindahkan metadata, bukan encode ulang

### 2. Thumbnail Video Hitam
**Root Cause**: Appwrite tidak support `getFilePreview()` untuk video.

**Solusi**:
- Generate thumbnail manual menggunakan ffmpeg
- Ambil frame dari detik ke-2 video
- Simpan sebagai JPG 1280x720
- Upload thumbnail terpisah ke Appwrite Storage

## File yang Dibuat/Dimodifikasi

### Baru Dibuat
1. **`video-processing.service.ts`**
   - `optimizeForStreaming()`: Optimize video dengan faststart
   - `generateThumbnail()`: Generate thumbnail dari frame video
   - `cleanupFiles()`: Cleanup temp files

2. **`docs/video/VIDEO_PROCESSING_SETUP.md`**
   - Dokumentasi setup Appwrite Database
   - Cara kerja upload flow
   - Troubleshooting guide

### Dimodifikasi
1. **`video-queues.module.ts`**
   - Simplify queue configuration
   - Concurrency: 3 workers
   - Rate limit: 10 job/10s
   - Retry: 3x exponential backoff
   - Timeout: 5 menit
   - Cleanup: 200 completed, 100 failed

2. **`video-processing.queue.ts`** (consumer)
   - Update progress di 4 titik: 10%, 40%, 70%, 100%
   - Optimize → Generate thumbnail → Upload paralel
   - Update Appwrite Database dengan videoId & thumbnailId
   - Cleanup temp files di finally block

3. **`videos.controller.ts`**
   - `POST /videos/upload`: Upload file, buat placeholder, add job ke queue
   - `GET /videos/:id/status`: Polling status & progress
   - `GET /videos/queue/stats`: Monitoring queue

4. **`videos.module.ts`**
   - Tambah `VideoProcessingService` ke providers
   - Update consumer dari `VideoProcessingProcessor` ke `VideoProcessingConsumer`

5. **`video-storage.service.ts`**
   - Tambah method `uploadFile()` untuk generic upload

6. **`.env.example`**
   - Tambah `APPWRITE_DATABASE_ID`
   - Tambah `APPWRITE_VIDEO_COLLECTION_ID`

### Dihapus
1. **`video-processors.ts`** (old processor, tidak dipakai lagi)

## Dependencies Baru
- `ffmpeg-static`: Binary ffmpeg untuk optimize & thumbnail

## Cara Pakai

### 1. Install Dependencies
```bash
cd apps/backend
npm install
```

### 2. Setup Appwrite Database
Ikuti panduan di `docs/video/VIDEO_PROCESSING_SETUP.md`

### 3. Update Environment Variables
```env
APPWRITE_DATABASE_ID="your-database-id"
APPWRITE_VIDEO_COLLECTION_ID="your-video-collection-id"
```

### 4. Start Backend
```bash
npm run start:dev
```

### 5. Test Upload
```bash
curl -X POST http://localhost:4000/videos/upload-optimized \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@test.mp4" \
  -F "title=Test Video" \
  -F "description=Test upload"
```

Response:
```json
{
  "videoId": "abc123",
  "status": "processing",
  "message": "Video sedang diproses"
}
```

### 6. Polling Status
```bash
curl http://localhost:4000/videos/abc123/status
```

Response:
```json
{
  "status": "processing",
  "progress": 40,
  "videoId": null,
  "thumbnailId": null
}
```

Setelah selesai:
```json
{
  "status": "ready",
  "progress": 100,
  "videoId": "xyz789",
  "thumbnailId": "thumb456"
}
```

### 7. Monitoring Queue
```bash
curl http://localhost:4000/videos/queue/stats
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

## Performance

### Untuk 500 User Concurrent Upload
- **Rate limit**: 10 job/10s = 60 job/menit = 3600 job/jam
- **Concurrency**: 3 workers paralel
- **Average processing time**: 30-60 detik per video (tergantung ukuran)
- **Queue capacity**: Unlimited (Redis)

### Estimasi
- 500 user upload bersamaan → masuk queue dalam 1-2 menit
- Proses selesai dalam 30-60 menit (tergantung ukuran video)
- User langsung dapat response, tidak perlu tunggu proses selesai

## Monitoring & Troubleshooting

### Cek Queue Stats
```bash
curl http://localhost:4000/videos/queue/stats
```

### Cek Redis
```bash
redis-cli
> KEYS bull:video-processing:*
> LLEN bull:video-processing:waiting
> LLEN bull:video-processing:active
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

## Next Steps

1. **Frontend Integration**
   - Buat UI upload dengan progress bar
   - Implement polling untuk status
   - Show thumbnail setelah processing selesai

2. **Optimization**
   - Add video compression untuk reduce file size
   - Multiple quality variants (360p, 480p, 720p)
   - Adaptive bitrate streaming (HLS/DASH)

3. **Monitoring**
   - Add Sentry/logging untuk track errors
   - Dashboard untuk monitoring queue
   - Alert jika queue terlalu panjang atau banyak failed jobs

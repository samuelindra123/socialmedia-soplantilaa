# Setup Video Upload - Quick Start

## ✅ Yang Sudah Dilakukan

1. **Migration Database** ✅
   - Field baru sudah ditambahkan ke model `Video` di Prisma
   - Migration sudah dijalankan: `20260410051721_add_video_upload_fields`
   - Field baru: `progress`, `videoId`, `thumbnailId`, `originalSize`, `compressedSize`

2. **Environment Variables** ✅
   - Tidak perlu tambahan env baru
   - Menggunakan DATABASE_URL yang sudah ada (Supabase PostgreSQL)
   - Menggunakan APPWRITE_* yang sudah ada untuk storage

3. **Code Implementation** ✅
   - VideoProcessingService dengan kompresi penuh
   - BullMQ worker dengan 5 progress points
   - Controller dengan validasi 100MB + format
   - Prisma integration (bukan Supabase JS Client)

## 🚀 Cara Pakai

### 1. Test Upload Video

```bash
curl -X POST http://localhost:4000/videos/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@test.mp4" \
  -F "title=Test Video"
```

Response:
```json
{
  "id": "uuid",
  "status": "processing"
}
```

### 2. Polling Status

```bash
curl http://localhost:4000/videos/{id}/status
```

Response (processing):
```json
{
  "status": "processing",
  "progress": 30
}
```

Response (ready):
```json
{
  "status": "ready",
  "progress": 100,
  "videoUrl": "https://appwrite.../video.mp4",
  "thumbnailUrl": "https://appwrite.../thumb.jpg",
  "duration": 120,
  "width": 1280,
  "height": 720,
  "originalSize": 52428800,
  "compressedSize": 20971520
}
```

### 3. List Videos

```bash
curl http://localhost:4000/videos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Queue Stats

```bash
curl http://localhost:4000/videos/queue/stats
```

## 📊 Database Schema

Tabel `Video` sekarang memiliki field:

```prisma
model Video {
  // ... existing fields
  progress       Int         @default(0)        // NEW
  videoId        String?                        // NEW - Appwrite file ID
  thumbnailId    String?                        // NEW - Appwrite file ID
  originalSize   BigInt?                        // NEW - ukuran asli
  compressedSize BigInt?                        // NEW - ukuran compressed
}
```

## ⚙️ Konfigurasi

### Validasi Upload
- Max size: 100MB
- Format: mp4, mov, webm

### Kompresi
- Codec: libx264 crf 28
- Preset: fast
- Audio: aac 128k
- Max resolution: 1280x720
- Target: 30-50% reduction

### Queue
- Concurrency: 3 workers
- Rate limit: 10 job/10s
- Timeout: 10 menit
- Retry: 3x exponential backoff

### Progress Tracking
- 10% - Start
- 30% - Compress selesai
- 60% - Thumbnail selesai
- 85% - Upload selesai
- 100% - Database updated

## 🎯 Testing Checklist

- [ ] Upload video < 100MB → Success
- [ ] Upload video > 100MB → Error "File size exceeds 100MB limit"
- [ ] Upload format invalid → Error "Invalid format"
- [ ] Polling status → Progress 0-100%
- [ ] Video ready → URL tersedia
- [ ] List videos → Hanya yang status READY
- [ ] Queue stats → Monitoring berjalan

## 📝 Notes

- Tidak perlu setup Supabase JS Client (sudah pakai Prisma)
- Migration sudah jalan otomatis
- Temp files auto cleanup di finally block
- BigInt fields di-convert ke Number di response API

## 🎉 Status

✅ Migration applied
✅ Build successful (0 errors)
✅ Ready untuk testing

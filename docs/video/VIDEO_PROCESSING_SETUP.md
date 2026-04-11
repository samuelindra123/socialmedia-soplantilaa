# Setup Video Processing dengan Appwrite Storage

## Requirement

Fitur video processing membutuhkan:
- BullMQ + Redis (sudah ada di project)
- ffmpeg-static (sudah diinstall)
- PostgreSQL Database dengan Prisma (sudah ada)
- Appwrite Storage untuk menyimpan video & thumbnail

## Setup

### 1. Database (Sudah Ada)

Model `Video` di Prisma sudah memiliki field yang dibutuhkan:
- `processedUrl`: URL video yang sudah dioptimize
- `thumbnailUrl`: URL thumbnail
- `status`: Status processing (PROCESSING, READY, FAILED)

### 2. Appwrite Storage (Sudah Ada)

Pastikan bucket Appwrite sudah dikonfigurasi di `.env`:

```env
APPWRITE_ENDPOINT="https://sgp.cloud.appwrite.io/v1"
APPWRITE_PROJECT_ID="your-project-id"
APPWRITE_API_KEY="your-api-key"
APPWRITE_BUCKET_ID="your-bucket-id"
```

## Cara Kerja

### Upload Flow

1. **User upload video** → `POST /videos/upload-optimized`
   - File disimpan sementara ke `os.tmpdir()`
   - Buat record di Prisma dengan `status: 'PROCESSING'`
   - Add job ke BullMQ queue
   - Return response langsung ke user (tidak menunggu proses selesai)

2. **Background Processing** (BullMQ Worker)
   - Progress 10%: Start processing
   - Optimize video dengan `ffmpeg -movflags faststart` (pindahkan moov atom ke awal)
   - Progress 40%: Optimize selesai
   - Generate thumbnail dari frame detik ke-2 (1280x720 JPG)
   - Progress 70%: Thumbnail selesai
   - Upload video + thumbnail ke Appwrite Storage secara paralel
   - Update Prisma dengan `processedUrl`, `thumbnailUrl`, `status: 'READY'`
   - Progress 100%: Selesai
   - Cleanup semua temp files

3. **Frontend Polling** → `GET /videos/:id/status`
   - Return: `{ status, progress, processedUrl, thumbnailUrl }`
   - Frontend bisa polling setiap 2-3 detik sampai status = 'ready'

### Queue Configuration

- **Concurrency**: 3 worker (maksimal 3 video diproses bersamaan)
- **Rate Limit**: 10 job per 10 detik
- **Retry**: 3x dengan exponential backoff (5s, 10s, 20s)
- **Timeout**: 5 menit per video
- **Cleanup**: Keep 200 completed jobs, 100 failed jobs

### Monitoring

`GET /videos/queue/stats` untuk monitoring:
```json
{
  "waiting": 5,
  "active": 3,
  "completed": 120,
  "failed": 2
}
```

## Troubleshooting

### Video masih lambat loading
- Pastikan video sudah dioptimize dengan faststart
- Cek apakah moov atom sudah di awal file: `ffprobe video.mp4 | grep moov`

### Thumbnail hitam
- Pastikan video memiliki frame di detik ke-2
- Coba ubah timestamp di `generateThumbnail()` dari `'2'` ke `'1'` atau `'0.5'`

### Job stuck di queue
- Cek Redis connection: `redis-cli ping`
- Restart worker: `npm run start:dev`
- Cek logs untuk error ffmpeg

### Temp files tidak terhapus
- Pastikan `finally` block di worker selalu dijalankan
- Manual cleanup: `rm -rf /tmp/upload-* /tmp/optimized-* /tmp/thumb-*`

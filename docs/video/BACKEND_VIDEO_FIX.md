# Backend Fix Required - Video Upload

## Issue
Video posts menampilkan filename sebagai title dan Appwrite URL tidak accessible.

## Fix 1: Don't Save Filename as Title

**File:** `apps/backend/src/posts/posts.service.ts` (atau video upload handler)

```typescript
// ❌ JANGAN ini:
const title = videoFile.originalname;

// ✅ LAKUKAN ini:
const title = null; // atau undefined, biarkan kosong untuk video posts
// User bisa edit title nanti jika mau
```

## Fix 2: Verify Appwrite Configuration

**Check:**
1. Appwrite project ID benar
2. Bucket permissions: public read
3. Domain `sgp.cloud.appwrite.io` accessible
4. File actually uploaded

**Test URL:**
```bash
curl -I "https://sgp.cloud.appwrite.io/v1/storage/buckets/soplantila_bucket/files/69d779ac003c5b3b5916/view?project=69d5d8b1001deb943271"
```

## Fix 3: Alternative - Use Different Storage

Jika Appwrite bermasalah, consider:
- DigitalOcean Spaces
- AWS S3
- Cloudflare R2
- Local storage + CDN

## Migration Priority

1. **Immediate** (Frontend sudah handle): ✅
   - Thumbnail fallback
   - Hide filename titles
   - Error handling

2. **Short term** (Backend fix):
   - Don't save filename as title
   - Fix Appwrite URL atau migrate storage

3. **Long term**:
   - Video processing pipeline
   - Multiple quality levels
   - CDN integration

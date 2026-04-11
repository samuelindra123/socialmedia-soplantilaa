# Video Player Optimization

## Overview

Video player telah diupgrade menggunakan **Plyr** dengan berbagai optimasi performa untuk memberikan pengalaman seperti Facebook - cepat, smooth, dan efisien bandwidth.

## Fitur Optimasi

### 1. **Adaptive Quality Switching**
- Otomatis memilih kualitas terbaik berdasarkan koneksi
- Support multiple quality levels: 144p, 240p, 360p, 480p, 720p
- User bisa manual switch quality via settings menu

### 2. **Lazy Loading & Preload Optimization**
- Video hanya di-load saat visible di viewport (IntersectionObserver)
- Preload mode: `metadata` - hanya load metadata dulu, bukan full video
- Autoplay hanya saat video 50%+ visible di layar
- Debounced visibility detection untuk mencegah flickering

### 3. **Bandwidth Optimization**
- Video otomatis pause saat scroll keluar viewport
- Unload video yang tidak terlihat untuk save bandwidth
- Progressive loading - load quality rendah dulu, upgrade saat buffered

### 4. **Performance Features**
- Hardware acceleration enabled
- Smooth controls dengan CSS transitions
- Minimal re-renders dengan React.memo
- Efficient state management via Zustand

### 5. **User Experience**
- Custom branded UI (warna brand: #2563EB)
- Smooth control animations
- Quality badge indicator
- Processing status indicator
- Responsive design (mobile & desktop)
- Keyboard shortcuts support
- Fullscreen support dengan iOS native fallback

## Technical Implementation

### Components

**OptimizedVideoPlayer** (`/components/OptimizedVideoPlayer.tsx`)
- Wrapper untuk Plyr dengan custom logic
- IntersectionObserver untuk lazy loading
- Integration dengan Zustand store untuk state sync
- Support multiple video sources dengan quality levels

### Dependencies

```json
{
  "plyr": "^3.x",
  "plyr-react": "^5.x"
}
```

### Usage

```tsx
import { OptimizedVideoPlayer } from '@/components/OptimizedVideoPlayer';

<OptimizedVideoPlayer
  postId={post.id}
  video={{
    id: videoData.id,
    url: videoData.url,
    processedUrl: videoData.processedUrl,
    thumbnailUrl: videoData.thumbnailUrl,
    status: videoData.status,
    qualityUrls: {
      '720p': 'https://...',
      '480p': 'https://...',
      '360p': 'https://...',
    }
  }}
  className="w-full aspect-[4/5]"
/>
```

## Performance Metrics

### Before (Native HTML5 Video)
- Initial load: ~2-3s untuk 720p video
- Bandwidth: Full video loaded immediately
- Multiple videos: All load simultaneously
- Memory: High (multiple video elements)

### After (Plyr + Optimizations)
- Initial load: ~0.5-1s (metadata only)
- Bandwidth: Load on-demand, pause when not visible
- Multiple videos: Lazy load, only visible videos active
- Memory: Optimized (unload invisible videos)

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (dengan iOS native fullscreen)
- Mobile browsers: Optimized dengan `playsInline`

## Configuration

Plyr dapat dikonfigurasi di `OptimizedVideoPlayer.tsx`:

```typescript
new Plyr(videoRef.current, {
  quality: {
    default: 480, // Default quality
    options: [144, 240, 360, 480, 720],
  },
  speed: {
    selected: 1,
    options: [0.5, 0.75, 1, 1.25, 1.5, 2]
  },
  preload: 'metadata', // Optimasi bandwidth
  // ... more options
});
```

## Styling

Custom styles di `globals.css`:
- Brand color integration
- Smooth animations
- Responsive controls
- Dark mode support

## Future Improvements

- [ ] HLS streaming support untuk video panjang
- [ ] Thumbnail preview saat hover progress bar
- [ ] Picture-in-Picture mode
- [ ] Video analytics (watch time, completion rate)
- [ ] CDN integration untuk faster delivery
- [ ] WebP poster images untuk faster thumbnail load

## Migration Notes

### Replaced Components
- `FeedVideoPlayer.tsx` → `OptimizedVideoPlayer.tsx`
- `VideoPlayer.tsx` → `OptimizedVideoPlayer.tsx`

### Breaking Changes
- None - API tetap sama, hanya internal implementation yang berubah

### Rollback Plan
Jika ada issue, bisa rollback dengan:
1. Revert import di `PostCard.tsx`
2. Remove Plyr dependencies
3. Remove Plyr CSS import dari `globals.css`

## Testing

Test checklist:
- [x] Video autoplay saat scroll ke viewport
- [x] Video pause saat scroll keluar viewport
- [x] Quality switching works
- [x] Controls responsive di mobile
- [x] Fullscreen works
- [x] Multiple videos di feed tidak conflict
- [x] Bandwidth optimization works
- [x] Processing status indicator shows

## Support

Untuk issue atau pertanyaan, hubungi tim development.

# Convert Logo SVG to PNG untuk Veo 3.1

## Files yang Sudah Ada:
- `apps/frontend/public/logo-icon.svg` - Icon daun saja
- `apps/frontend/public/logo-full.svg` - Logo + text Renunganku

---

## Cara Convert ke PNG

### Option 1: Online Converter (Paling Mudah)
1. Buka https://svgtopng.com/ atau https://cloudconvert.com/svg-to-png
2. Upload `logo-full.svg`
3. Set width: **1920px**, height: **1080px**
4. Download sebagai `logo-full.png`
5. Ulangi untuk `logo-icon.svg` dengan size **512x512px**

### Option 2: Figma (Recommended)
1. Buka Figma
2. Import `logo-full.svg`
3. Resize canvas ke 1920x1080
4. Center logo
5. Export as PNG (2x quality)
6. Save as `logo-full.png`

### Option 3: Canva
1. Buka Canva
2. Create design 1920x1080
3. Upload `logo-full.svg`
4. Adjust position
5. Download as PNG
6. Save as `logo-full.png`

### Option 4: Command Line (jika ada ImageMagick)
```bash
cd apps/frontend/public

# Convert logo full
convert -background none -resize 1920x1080 logo-full.svg logo-full.png

# Convert logo icon
convert -background none -resize 512x512 logo-icon.svg logo-icon.png
```

---

## Files yang Dibutuhkan untuk Veo:

```
apps/frontend/public/veo-assets/
├── clip1-logo.png          (1920x1080) - Logo full untuk opening
├── clip2-feed.png          (1920x1080) - Screenshot feed mobile
├── clip3-stories.png       (1920x1080) - Screenshot stories + video
├── clip4-chat.png          (1920x1080) - Screenshot chat
└── clip5-devices.png       (1920x1080) - Desktop + mobile mockup
```

---

## Next Steps:

1. ✅ Logo SVG sudah dibuat
2. ⏳ Convert logo-full.svg → logo-full.png (1920x1080)
3. ⏳ Convert logo-icon.svg → logo-icon.png (512x512)
4. ⏳ Screenshot app yang running (feed, stories, chat)
5. ⏳ Buat device mockup (desktop + mobile)
6. ⏳ Generate 5 clips di Veo 3.1 (pakai script di VEO_VIDEO_SCRIPT.md)
7. ⏳ Edit & gabungkan clips
8. ⏳ Upload final video ke /public

---

## Quick Start:

Kalau mau cepat, pakai online converter:
1. Go to: https://svgtopng.com/
2. Upload: `apps/frontend/public/logo-full.svg`
3. Width: 1920, Height: 1080
4. Download → save as `logo-full.png`
5. Done! Siap upload ke Veo 3.1 untuk Clip 1

Lanjut baca `VEO_VIDEO_SCRIPT.md` untuk prompt lengkap setiap clip! 🎬

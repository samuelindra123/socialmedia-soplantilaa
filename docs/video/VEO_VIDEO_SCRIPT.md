# Script Video Demo Soplantila untuk Veo 3.1
## Format: 5 Clip @ 8 detik = 40 detik total
## Resolution: 1920x1080 (16:9) | Style: Modern, Clean UI

---

## 📹 CLIP 1: Opening & Logo Reveal (0-8 detik)

### Veo 3.1 Prompt:
```
A modern minimalist logo animation on dark slate background. A leaf icon in white inside a dark rounded square slowly rotates and scales up from center. The text "Soplantila" fades in below the icon in elegant sans-serif font. Soft ambient lighting with subtle glow effect around the logo. Clean, professional, tech startup aesthetic. Smooth camera push in. 4K quality, cinematic.
```

### Image Input:
- Upload: `logo-full.svg` (converted to PNG 1920x1080)

### Scene Description:
- Background: Solid #0F172A (slate-900)
- Logo icon (leaf) muncul dari center dengan scale animation
- Rotate 360° smooth (8 detik)
- Text "Soplantila" fade in dari bawah
- Tagline "Sosial media yang gak bikin pusing" muncul
- Subtle glow effect

### Audio Notes:
- Ambient electronic music starts
- Soft whoosh sound

---

## 📹 CLIP 2: Mobile Feed Scrolling (8-16 detik)

### Veo 3.1 Prompt:
```
Close-up screen recording of a modern social media mobile app interface. Clean white feed with rounded post cards showing photos and text. Smooth vertical scrolling through 4-5 posts. No ads between posts. Minimalist design with slate and white color scheme. User's finger gently scrolls from bottom to top. Professional UI/UX design. Natural scrolling speed. Bright, clean lighting. 4K screen capture quality.
```

### Image Input:
- Upload: Screenshot feed mobile app (1080x1920 crop to 1920x1080)

### Scene Description:
- Mobile phone mockup di center
- Feed dengan 4-5 post cards
- Scroll smooth dari atas ke bawah
- Highlight: NO ADS between posts
- Clean UI dengan rounded corners
- Post content: foto landscape, text, video thumbnail

### Text Overlay (add in editing):
```
Feed yang bersih
Cuma konten dari orang yang lo follow
```

### Audio Notes:
- Subtle scroll sound
- Music continues

---

## 📹 CLIP 3: Stories & Video Player (16-24 detik)

### Veo 3.1 Prompt:
```
Modern mobile app interface showing Instagram-style stories bar at top with circular profile avatars. User taps one story circle, smooth transition to fullscreen vertical story with gradient overlay. Then transitions to a clean video player with minimal controls playing a landscape video. Smooth animations, modern UI design. Slate and white color palette. Professional screen recording. 4K quality.
```

### Image Input:
- Upload: Screenshot stories bar + video player

### Scene Description:
- Stories bar di top dengan 5-6 avatar circles
- Tap animation pada satu story
- Fullscreen story muncul (vertical)
- Swipe gesture ke kanan
- Transisi ke video player (horizontal)
- Video playing dengan clean controls

### Text Overlay:
```
Stories & Video
Tanpa gangguan, tanpa iklan
```

### Audio Notes:
- Tap sound
- Swipe sound
- Video audio fade in briefly

---

## 📹 CLIP 4: Chat & Messages (24-32 detik)

### Veo 3.1 Prompt:
```
Modern messaging app interface with clean chat list. User scrolls through conversations, taps one chat to open. Smooth transition to chat screen with message bubbles in slate and white colors. Keyboard appears from bottom, user types a message with typing animation. Send button glows and message sends with smooth animation. Minimal, clean design. Professional UI. 4K quality.
```

### Image Input:
- Upload: Screenshot chat list + conversation screen

### Scene Description:
- Chat list dengan 6-7 conversations
- Avatar + last message preview
- Tap satu chat → open conversation
- Chat bubbles (sent: slate-900, received: white)
- Keyboard muncul dari bawah
- Typing indicator animation
- Send button tap → message sent

### Text Overlay:
```
Chat aman & privat
Data lo gak dijual ke siapa-siapa
```

### Audio Notes:
- Keyboard typing sound (subtle)
- Message send sound (soft ping)

---

## 📹 CLIP 5: Multi-Device & Closing (32-40 detik)

### Veo 3.1 Prompt:
```
Split screen showing the same social media app on desktop (left) and mobile (right) simultaneously. Both screens show synchronized content - same feed, same posts. Smooth zoom out revealing both devices. Camera slowly rotates around the devices. Then transition to the Soplantila logo with leaf icon on dark background. Text appears: "Daftar gratis sekarang". Modern, professional, tech product showcase. Cinematic lighting. 4K quality.
```

### Image Input:
- Upload: Desktop + Mobile mockup side by side

### Scene Description:
- Split screen: Desktop (left) + Mobile (right)
- Same content on both screens
- Zoom out smooth
- Camera rotate 15° around devices
- Fade to logo
- CTA text appears

### Text Overlay:
```
Responsive di semua device

RENUNGANKU
Daftar gratis sekarang
renunganku.peakcenter.tech
```

### Audio Notes:
- Music builds up
- Fade out smooth

---

## 🎨 Design Specifications

### Color Palette:
- Primary: `#0F172A` (slate-900)
- Secondary: `#1E293B` (slate-800)
- Accent: `#64748B` (slate-500)
- Background: `#FAFAFA`
- White: `#FFFFFF`

### Typography:
- Logo/Heading: **Space Grotesk** (Bold 700)
- Body/UI: **Plus Jakarta Sans** (Regular 400, Medium 500)

### Animation Timing:
- Transitions: 300-500ms ease-out
- Scroll speed: Natural (not too fast)
- Tap feedback: 150ms
- Logo rotation: 8 seconds full 360°

---

## 📦 Assets to Prepare

### Before Veo Generation:

1. **Logo PNG** (1920x1080):
   ```bash
   # Convert SVG to PNG
   # Use Figma/Canva or online converter
   logo-full.svg → logo-full.png (1920x1080)
   logo-icon.svg → logo-icon.png (512x512)
   ```

2. **App Screenshots** (from running app):
   - Feed mobile view (1080x1920)
   - Stories bar + video player
   - Chat list + conversation
   - Desktop + Mobile side by side

3. **Mockup Images**:
   - iPhone mockup with app screenshot
   - MacBook mockup with app screenshot

### File Structure:
```
apps/frontend/public/
├── logo-icon.svg
├── logo-full.svg
├── logo-icon.png (512x512)
├── logo-full.png (1920x1080)
└── veo-assets/
    ├── clip1-logo.png
    ├── clip2-feed.png
    ├── clip3-stories.png
    ├── clip4-chat.png
    └── clip5-devices.png
```

---

## 🎬 Veo 3.1 Generation Workflow

### Step-by-Step:

1. **Prepare all PNG images** (1920x1080 each)
2. **Generate Clip 1** (Logo):
   - Upload `logo-full.png`
   - Paste prompt
   - Generate 8 seconds
   - Download

3. **Generate Clip 2** (Feed):
   - Upload feed screenshot
   - Paste prompt
   - Generate 8 seconds
   - Download

4. **Generate Clip 3** (Stories):
   - Upload stories screenshot
   - Paste prompt
   - Generate 8 seconds
   - Download

5. **Generate Clip 4** (Chat):
   - Upload chat screenshot
   - Paste prompt
   - Generate 8 seconds
   - Download

6. **Generate Clip 5** (Devices):
   - Upload devices mockup
   - Paste prompt
   - Generate 8 seconds
   - Download

---

## ✂️ Post-Production (Editing)

### Tools:
- **CapCut** (free, easy) atau
- **DaVinci Resolve** (free, pro) atau
- **Adobe Premiere Pro**

### Steps:
1. Import 5 clips dari Veo
2. Arrange in timeline (Clip 1 → 2 → 3 → 4 → 5)
3. Add text overlays (sesuai script)
4. Add background music (lo-fi/ambient)
5. Add sound effects (tap, scroll, keyboard)
6. Color grade untuk consistency
7. Export: H.264, 1080p, 30fps

### Text Overlay Style:
- Font: Space Grotesk Bold
- Size: 48-60px
- Color: White with dark shadow
- Animation: Fade in from bottom (0.3s)
- Position: Lower third

---

## 🎵 Music Recommendation

**Royalty-Free Sources:**
- Epidemic Sound: "Calm Tech" category
- Artlist: "Corporate Modern" 
- YouTube Audio Library: "Ambient Electronic"

**Specs:**
- BPM: 80-100
- Mood: Calm, Professional, Modern
- Duration: 40+ seconds
- No vocals

---

## 📤 Final Export

### Video Specs:
```
Format: MP4 (H.264)
Resolution: 1920x1080 (Full HD)
Frame Rate: 30fps
Bitrate: 8-10 Mbps
Audio: AAC, 192kbps, Stereo
Duration: 40 seconds
```

### File Names:
```
demo-video.mp4 (main)
demo-video.webm (fallback)
demo-thumbnail.jpg (poster)
```

### Upload to:
```
apps/frontend/public/
├── demo-video.mp4
├── demo-video.webm
└── demo-thumbnail.jpg
```

---

## ✅ Checklist

- [ ] Convert logo SVG to PNG (1920x1080)
- [ ] Take app screenshots (feed, stories, chat, profile)
- [ ] Create device mockups (desktop + mobile)
- [ ] Generate Clip 1 in Veo 3.1
- [ ] Generate Clip 2 in Veo 3.1
- [ ] Generate Clip 3 in Veo 3.1
- [ ] Generate Clip 4 in Veo 3.1
- [ ] Generate Clip 5 in Veo 3.1
- [ ] Download all clips
- [ ] Edit in CapCut/Premiere
- [ ] Add text overlays
- [ ] Add music & SFX
- [ ] Export final video
- [ ] Upload to /public folder
- [ ] Test video player on landing page

---

**Total Production Time:** 2-3 hours (including Veo generation wait time)

**Result:** Professional 40-second product demo video showcasing Soplantila social media platform! 🎬

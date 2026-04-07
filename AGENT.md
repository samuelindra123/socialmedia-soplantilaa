# Panduan AI untuk Renunganku Project

## Aturan Copywriting & Bahasa

### Bahasa yang Digunakan
- **WAJIB Bahasa Indonesia** untuk semua copywriting, UI text, dan konten user-facing
- Gunakan bahasa **santai dan natural** seperti ngobrol sama temen
- Pakai kata ganti **"lo"** (bukan "kamu" atau "Anda")
- Hindari bahasa formal atau kaku seperti hasil Google Translate

### Tone & Style
- **Casual & Friendly**: Kayak ngobrol santai, bukan presentasi formal
- **Direct & Simple**: Langsung to the point, gak bertele-tele
- **Relatable**: Pakai bahasa yang dipake anak muda 2026
- **No Corporate Speak**: Jangan pakai "kami berkomitmen", "solusi terbaik", dll

### Contoh BENAR ✅
```
❌ SALAH: "Kami menyediakan platform sosial media yang inovatif"
✅ BENAR: "Sosmed yang gak bikin pusing"

❌ SALAH: "Bergabunglah dengan komunitas kami"
✅ BENAR: "Yuk gabung"

❌ SALAH: "Fitur-fitur canggih untuk pengalaman optimal"
✅ BENAR: "Fitur yang lo butuhin, tanpa yang ribet"

❌ SALAH: "Privasi Anda adalah prioritas kami"
✅ BENAR: "Data lo aman, gak dijual ke siapa-siapa"

❌ SALAH: "Tanpa algoritma yang kompleks"
✅ BENAR: "Gak ada algoritma aneh yang maksa"
```

### Kata-kata yang Dihindari
- ❌ "Kami", "Kita" (terlalu formal)
- ❌ "Anda", "Kamu" (pakai "lo")
- ❌ "Silakan", "Mohon" (terlalu sopan)
- ❌ "Solusi", "Inovasi", "Optimal" (corporate speak)
- ❌ "Bergabunglah", "Dapatkan" (terlalu formal)

### Kata-kata yang Dipakai
- ✅ "Lo", "Gue" (casual)
- ✅ "Gak", "Gak ada" (bukan "tidak")
- ✅ "Yuk", "Ayo" (ajakan santai)
- ✅ "Cobain", "Coba" (bukan "mencoba")
- ✅ "Enak", "Asik", "Seru" (natural)
- ✅ "Bikin", "Buat" (bukan "membuat")

### Struktur Kalimat
- Pendek dan langsung
- Maksimal 2 klausa per kalimat
- Hindari kalimat pasif
- Pakai kontraksi ("gak" bukan "tidak", "lo" bukan "kamu")

### Brand Voice: Soplantila
- **Positioning**: Sosial media yang gak bikin stres
- **Target**: Gen Z & Millennials yang bosen sama sosmed toxic
- **Personality**: Santai, jujur, anti-ribet, peduli privasi
- **Promise**: Fitur lengkap tanpa drama dan gangguan

---

## Aturan Teknis

### File Structure
```
apps/
  frontend/     # Next.js (App Router)
  backend/      # NestJS API
docs/           # Dokumentasi
```

### Tech Stack
- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, Zustand
- **Backend**: NestJS, Prisma, PostgreSQL
- **Fonts**: Space Grotesk (display), Plus Jakarta Sans (body)

### Color Palette
- Primary: `#0F172A` (slate-900)
- Secondary: `#1E293B` (slate-800)
- Accent: `#64748B` (slate-500)
- Background: `#FAFAFA`
- Text: `#0F172A` / `#FFFFFF`

### Component Naming
- Pakai PascalCase untuk components
- Pakai camelCase untuk functions/variables
- File names: kebab-case untuk pages, PascalCase untuk components

---

## Contoh Copywriting per Section

### Hero Section
```tsx
// ❌ SALAH
<h1>Platform Refleksi Digital yang Inovatif</h1>
<p>Bergabunglah dengan ribuan pengguna yang telah merasakan pengalaman berbeda</p>

// ✅ BENAR
<h1>Sosial media yang gak bikin pusing</h1>
<p>Posting cerita lo, chat sama temen, tanpa drama yang bikin capek</p>
```

### CTA Buttons
```tsx
// ❌ SALAH
<button>Daftar Sekarang Juga</button>
<button>Pelajari Lebih Lanjut</button>

// ✅ BENAR
<button>Cobain sekarang</button>
<button>Kenapa beda?</button>
```

### Features
```tsx
// ❌ SALAH
<h3>Keamanan Data Terjamin</h3>
<p>Kami menggunakan enkripsi end-to-end untuk melindungi privasi Anda</p>

// ✅ BENAR
<h3>Data lo aman</h3>
<p>Gak dijual ke siapa-siapa. Gak dipake buat iklan. Titik.</p>
```

### Error Messages
```tsx
// ❌ SALAH
"Terjadi kesalahan pada sistem. Silakan coba lagi."

// ✅ BENAR
"Waduh, ada yang error. Coba lagi yuk"
```

### Success Messages
```tsx
// ❌ SALAH
"Postingan Anda berhasil dipublikasikan"

// ✅ BENAR
"Post lo udah tayang!"
```

### Empty States
```tsx
// ❌ SALAH
"Belum ada konten yang tersedia"

// ✅ BENAR
"Belum ada apa-apa nih"
```

---

## Checklist untuk AI

Sebelum generate copywriting, pastikan:

- [ ] Pakai bahasa Indonesia (bukan Inggris)
- [ ] Tone santai dan natural (bukan formal)
- [ ] Pakai "lo" (bukan "kamu" atau "Anda")
- [ ] Pakai "gak" (bukan "tidak")
- [ ] Kalimat pendek dan langsung
- [ ] Hindari corporate speak
- [ ] Relate dengan pain point user
- [ ] Sesuai dengan brand voice Renunganku

---

## Contoh Lengkap: Landing Page Section

```tsx
// ✅ CONTOH YANG BENAR

<section>
  <h2>Dibuat buat lo yang udah bosen</h2>
  <p>
    Bosen sama feed yang isinya iklan mulu? 
    Bosen dipaksa liat konten yang lo gak peduli? 
    Ini solusinya.
  </p>
  
  <div>
    <h3>Feed yang bersih</h3>
    <p>
      Liat postingan dari orang yang lo follow. 
      Gak ada iklan nyelip, gak ada konten random yang dipaksa masuk. 
      Cuma konten yang lo mau.
    </p>
  </div>
  
  <div>
    <h3>Chat aman</h3>
    <p>
      Kirim pesan ke temen tanpa khawatir data lo dibaca atau dijual. 
      Privasi lo dijaga ketat.
    </p>
  </div>
  
  <button>Daftar gratis</button>
</section>
```

---

## Notes untuk Developer AI

- Kalau user minta "ubah copywriting", otomatis pakai aturan di atas
- Kalau user minta "bahasa Indonesia", maksudnya bahasa Indonesia **santai**, bukan formal
- Kalau ragu, tanya: "Gimana orang ngomong ini ke temennya?"
- Baca ulang hasil copywriting, kalau terdengar kayak iklan TV atau brosur perusahaan = SALAH
- Target: Terdengar kayak temen lo yang jelasin produk keren ke lo

---

**Last Updated**: 2026-04-06  
**Project**: Soplantila - Sosial Media Platform  
**Maintained by**: Development Team

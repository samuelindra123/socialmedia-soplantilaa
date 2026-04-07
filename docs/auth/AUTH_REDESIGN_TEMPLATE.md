# Auth Pages Redesign Template

## ✅ Completed:
1. Login - Professional Facebook/Instagram style
2. Signup - Same style as login

## 🎨 Design Pattern (Apply to all remaining pages):

### Layout Structure:
```tsx
<div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
  <div className="w-full max-w-[1000px] grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
    
    {/* LEFT - BRANDING */}
    <div className="hidden lg:block space-y-6 px-8">
      {/* Logo daun + Soplantila */}
      {/* Headline */}
      {/* Description */}
      {/* Feature cards dengan colored icons */}
    </div>

    {/* RIGHT - FORM */}
    <div className="w-full max-w-[400px] mx-auto lg:mx-0">
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 p-8 lg:p-10">
        {/* Mobile logo */}
        {/* Heading */}
        {/* Form content */}
      </div>
      
      {/* Secondary card (optional) */}
      <div className="mt-6 text-center bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
        {/* Secondary action */}
      </div>
      
      {/* Footer badge */}
      <div className="mt-6 flex justify-center items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4" />
        <span>Koneksi aman & terenkripsi SSL</span>
      </div>
    </div>
  </div>
</div>
```

### Logo SVG (Leaf icon):
```tsx
<svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
</svg>
```

### Input Style:
```tsx
<input 
  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all"
/>
```

### Button Style:
```tsx
<button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/20">
```

## 📋 Remaining Pages to Redesign:

### 1. Verify (`/verify`)
**Branding:**
- Headline: "Verifikasi email lo"
- Description: "Cek inbox email lo, kami kirim kode verifikasi"
- Features: Email icon (blue), Clock icon (orange)

**Form:**
- OTP input (6 digits)
- Verify button
- Resend code link

### 2. Forgot Password (`/forgot-password`)
**Branding:**
- Headline: "Lupa password?"
- Description: "Gak masalah, kami bantu reset"
- Features: Lock icon (red), Mail icon (blue)

**Form:**
- Email input
- Send reset link button
- Back to login link

### 3. Forgot Password OTP (`/forgot-password/otp`)
**Branding:**
- Headline: "Masukkan kode OTP"
- Description: "Cek email lo, kami kirim kode 6 digit"
- Features: Shield icon (green), Clock icon (orange)

**Form:**
- OTP input
- Verify button
- Resend code

### 4. New Password (`/forgot-password/new-password`)
**Branding:**
- Headline: "Buat password baru"
- Description: "Bikin yang kuat ya, jangan lupa lagi"
- Features: Lock icon (purple), Check icon (green)

**Form:**
- New password input
- Confirm password input
- Reset password button

### 5. OAuth Callback (`/oauth/callback`)
**Simple centered card:**
- Loading spinner
- "Memproses login..."
- No branding section (just centered)

### 6. OAuth Consent (`/oauth/consent`)
**Branding:**
- Headline: "Konfirmasi akun Google"
- Description: "Kami butuh konfirmasi data lo"
- Features: Google icon, Shield icon

**Form:**
- User info display
- Confirm button
- Cancel button

## 🎨 Feature Icons Colors:
- Blue: `bg-blue-50` + `text-blue-600`
- Green: `bg-green-50` + `text-green-600`
- Purple: `bg-purple-50` + `text-purple-600`
- Orange: `bg-orange-50` + `text-orange-600`
- Red: `bg-red-50` + `text-red-600`

## ⚠️ Important:
- Keep all backend logic intact
- Keep all form validation
- Keep all error handling
- Keep all toast notifications
- Keep all redirects
- Only change UI/styling

## 🚀 Implementation Priority:
1. Verify (most used after signup)
2. Forgot Password flow (3 pages)
3. OAuth pages (less critical)

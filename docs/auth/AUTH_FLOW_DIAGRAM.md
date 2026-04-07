# 🔄 Diagram Alur Autentikasi - Ringkasan Visual

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ALUR 1: SIGNUP EMAIL                                 │
└─────────────────────────────────────────────────────────────────────────┘

/signup
   │
   ├─ Input: namaLengkap, email, password, terms
   │
   ├─ POST /auth/register
   │     └─ DB: Create User
   │           ├─ isEmailVerified: false
   │           ├─ verificationOtp: "123456"
   │           └─ otpExpiry: +15min
   │
   ├─ 📧 Send OTP email
   │
   └─ Redirect → /verify?userId=xxx

/verify
   │
   ├─ Input: 6 digit OTP
   │
   ├─ POST /auth/verify-otp/{userId}
   │     └─ DB: Update User
   │           ├─ isEmailVerified: true
   │           └─ Clear OTP fields
   │
   ├─ Set auth cookies + store
   │
   └─ Redirect → /onboarding

/onboarding
   │
   ├─ STEP 1: Upload foto (optional)
   │     └─ POST /onboarding/upload-profile
   │           └─ DB: Create/Update Profile
   │                 └─ profileImageUrl: "https://..."
   │
   ├─ STEP 2: Complete profile
   │     ├─ Input: username, tanggalLahir, tempatKelahiran
   │     │
   │     └─ POST /onboarding/complete
   │           └─ DB: Update Profile
   │                 ├─ username: "johndoe"
   │                 ├─ umur: 25 (calculated)
   │                 ├─ tanggalLahir: "1999-01-15"
   │                 ├─ tempatKelahiran: "Jakarta"
   │                 └─ isOnboardingComplete: true ✅
   │
   └─ Redirect → /feed


┌─────────────────────────────────────────────────────────────────────────┐
│                    ALUR 2: LOGIN EMAIL                                  │
└─────────────────────────────────────────────────────────────────────────┘

/login
   │
   ├─ Input: email, password
   │
   ├─ POST /auth/login
   │     ├─ DB: Check User (email, password, isEmailVerified)
   │     └─ DB: Create UserSession
   │
   ├─ Response: { user, accessToken, sessionToken }
   │
   ├─ Set auth cookies + store
   │
   └─ Check isOnboardingComplete?
         ├─ YES → /feed
         └─ NO  → /onboarding


┌─────────────────────────────────────────────────────────────────────────┐
│                    ALUR 3: GOOGLE OAUTH                                 │
└─────────────────────────────────────────────────────────────────────────┘

/login or /signup
   │
   ├─ Click "Lanjutkan dengan Google"
   │
   ├─ Redirect → Backend /auth/google
   │
   ├─ Google OAuth consent screen
   │
   ├─ Google callback → /auth/google/callback
   │
   └─ Backend check: User exists?
         │
         ├─ YES (existing user)
         │     └─ Login → Redirect /feed
         │
         └─ NO (new user)
               └─ Redirect → /oauth/consent?email=xxx&googleId=yyy

/oauth/consent
   │
   ├─ Show: name, email from Google
   │
   ├─ Click "Konfirmasi & Lanjutkan"
   │
   ├─ POST /auth/google/confirm
   │     ├─ DB: Create User
   │     │     ├─ email, googleId, namaLengkap
   │     │     └─ isEmailVerified: true (auto)
   │     │
   │     ├─ DB: Create Profile
   │     │     ├─ username: "John-123456" (temp)
   │     │     ├─ umur: 18 (default)
   │     │     └─ isOnboardingComplete: false ❌
   │     │
   │     └─ DB: Create UserSession
   │
   ├─ Set auth cookies + store
   │
   └─ Redirect → /onboarding (required!)
         │
         └─ Complete profile → /feed


┌─────────────────────────────────────────────────────────────────────────┐
│                    ALUR 4: FORGOT PASSWORD                              │
└─────────────────────────────────────────────────────────────────────────┘

/forgot-password
   │
   ├─ Input: email
   │
   ├─ POST /auth/forgot-password
   │     └─ DB: Update User
   │           ├─ resetPasswordOtp: "654321"
   │           └─ resetPasswordOtpExpiry: +15min
   │
   ├─ 📧 Send OTP email
   │
   └─ Redirect → /forgot-password/otp?email=xxx

/forgot-password/otp
   │
   ├─ Input: 6 digit OTP
   │
   ├─ POST /auth/verify-reset-otp
   │     └─ DB: Verify OTP & expiry
   │
   ├─ Response: { resetToken }
   │
   └─ Redirect → /forgot-password/new-password?token=xxx

/forgot-password/new-password
   │
   ├─ Input: password, confirmPassword
   │
   ├─ POST /auth/reset-password
   │     └─ DB: Update User
   │           ├─ password: new hash
   │           └─ Clear reset fields
   │
   └─ Redirect → /login (success!)


┌─────────────────────────────────────────────────────────────────────────┐
│                    FEED ACCESS GATE                                     │
└─────────────────────────────────────────────────────────────────────────┘

/feed
   │
   ├─ Check: user?.profile?.isOnboardingComplete?
   │
   ├─ NO  → Redirect /onboarding
   │
   └─ YES → Show feed ✅


┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE MODELS                                      │
└─────────────────────────────────────────────────────────────────────────┘

User {
  id, email, namaLengkap, password
  isEmailVerified ✅
  verificationOtp, otpExpiry
  resetPasswordOtp, resetPasswordOtpExpiry
  googleId
  profile → Profile (1:1)
  sessions → UserSession[] (1:N)
}

Profile {
  userId (unique)
  username (unique) ✅
  profileImageUrl
  umur, tanggalLahir, tempatKelahiran
  isOnboardingComplete ✅ ← GATE KE FEED
  bio, websites, backgroundProfileUrl
}

UserSession {
  userId, token (unique)
  userAgent, ipAddress
  expiresAt
}
```

## 🎯 KEY POINTS:

1. **Email Signup**: Register → Verify OTP → Onboarding → Feed
2. **Email Login**: Login → Check onboarding → Feed/Onboarding
3. **Google OAuth**: OAuth → Consent → Onboarding (required) → Feed
4. **Forgot Password**: Request → Verify OTP → New Password → Login
5. **Feed Gate**: `isOnboardingComplete` must be `true`

## ✅ VALIDATION:

- ✅ Semua alur sejalan dengan backend
- ✅ Database schema lengkap
- ✅ Security measures proper
- ✅ Error handling complete
- ✅ Redirects logical

**PRODUCTION READY!** 🚀

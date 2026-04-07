# 🐛 CRITICAL AUTH BUGS FOUND & FIXES

## 🚨 CRITICAL BUGS DISCOVERED:

### BUG #1: Token Not Stored After Login ⚠️
**Location**: `apps/frontend/src/app/(auth)/login/page.tsx:66-72`

**Problem**:
```typescript
useAuthStore.setState({
  user: result.user,
  token: null,  // ❌ BUG: Should be result.accessToken
  sessionToken: null,  // ❌ BUG: Should be result.sessionToken
  isAuthenticated: true,
  isLoading: false,
});
```

**Impact**: 
- User authenticated but tokens not stored
- API calls may fail due to missing auth token
- Session not tracked properly

**Fix**: Store actual tokens from result

---

### BUG #2: Auth Store Login Method Has Same Issue ⚠️
**Location**: `apps/frontend/src/store/auth.ts:40-47`

**Problem**:
```typescript
set({
  user: result.user,
  token: null,  // ❌ BUG
  sessionToken: null,  // ❌ BUG
  isAuthenticated: true,
  isLoading: false,
});
```

**Impact**: Same as Bug #1

**Fix**: Store actual tokens

---

### BUG #3: OAuth Callback Wrong Property Check ⚠️
**Location**: `apps/frontend/src/app/(auth)/oauth/callback/page.tsx:26`

**Problem**:
```typescript
if (user?.isVerified) {  // ❌ BUG: Property doesn't exist
  router.push("/feed");
} else {
  router.push("/onboarding");
}
```

**Impact**:
- Always redirects to `/onboarding` even if user completed it
- `isVerified` property doesn't exist in User type
- Should check `user?.profile?.isOnboardingComplete`

**Fix**: Use correct property

---

### BUG #4: Potential Infinite Loop in Feed ⚠️
**Location**: `apps/frontend/src/app/(social)/feed/page.tsx:104-107`

**Problem**:
```typescript
useEffect(() => {
  if (user && !isOnboardingDone) {
    router.replace('/onboarding');
  }
}, [user, isOnboardingDone, router]);
```

**Impact**:
- If onboarding fails or user navigates back, creates loop
- No loading state check
- Runs on every render when dependencies change

**Fix**: Add proper guards and loading checks

---

### BUG #5: Missing Session Token in Verify OTP ⚠️
**Location**: `apps/frontend/src/app/actions/auth-actions.ts:236-262`

**Problem**:
```typescript
export async function verifyEmailOtpAction(userId: string, otp: string): Promise<LoginResult> {
  // ... verification logic
  
  return {
    ok: true,
    user: {
      id: "",  // ❌ Empty user data
      email: "",
      namaLengkap: "",
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    },
    accessToken: result.data.accessToken,
    sessionToken: null,  // ❌ No session token
  };
}
```

**Impact**:
- User data incomplete after verification
- No session tracking after OTP verification
- Backend returns accessToken but no user info or session

**Fix**: Backend should return full user data + session like login does

---

### BUG #6: OAuth Consent Creates Profile Without Onboarding Flag ⚠️
**Location**: `apps/backend/src/auth/auth.service.ts:401-437`

**Problem**:
```typescript
const user = await this.prisma.user.create({
  data: {
    // ...
    profile: {
      create: {
        username: `${displayName?.split(' ')[0] || 'user'}-${Date.now()}`,
        tanggalLahir: new Date(),
        umur: 18,
        tempatKelahiran: 'Indonesia',
        // ❌ Missing: isOnboardingComplete: false
      },
    },
  },
  include: { profile: true },
});
```

**Impact**:
- Profile created but `isOnboardingComplete` defaults to false (from schema)
- This is actually CORRECT behavior
- But temporary username should be more obvious it needs changing

**Fix**: Make temporary username more obvious (e.g., `temp_user_123`)

---

### BUG #7: CheckAuth Sets Tokens to Null ⚠️
**Location**: `apps/frontend/src/store/auth.ts:73-80`

**Problem**:
```typescript
checkAuth: async () => {
  set({ isLoading: true });
  try {
    const { data } = await apiClient.get<User>('/users/profile');
    set({
      user: data,
      token: null,  // ❌ BUG: Clears existing tokens
      sessionToken: null,  // ❌ BUG
      isAuthenticated: true,
      isLoading: false
    });
  }
}
```

**Impact**:
- Tokens cleared when checking auth
- Should preserve existing tokens or not touch them

**Fix**: Don't set token fields in checkAuth

---

## 🔧 SECURITY ISSUES:

### ISSUE #1: Tokens Stored in LocalStorage via Zustand Persist
**Location**: `apps/frontend/src/store/auth.ts:95-99`

**Problem**:
```typescript
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'auth-storage',  // ❌ Stored in localStorage
    partialize: (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    }),
  }
)
```

**Current State**: 
- Only `user` and `isAuthenticated` persisted (GOOD!)
- Tokens NOT persisted (GOOD!)
- Tokens stored in HttpOnly cookies (GOOD!)

**Status**: ✅ Actually SECURE - tokens in cookies, not localStorage

---

### ISSUE #2: No CSRF Protection on State-Changing Operations
**Location**: All auth endpoints

**Problem**:
- No CSRF tokens for login, register, etc.
- Relying only on SameSite cookies

**Mitigation**:
- Using `sameSite: 'lax'` on cookies (GOOD)
- Using HttpOnly cookies (GOOD)
- Internal API token for server-to-server (GOOD)

**Status**: ✅ Acceptable for SameSite=lax + HttpOnly

---

## 🎯 FIXES REQUIRED:

### Priority 1 (Critical - Breaks Auth):
1. ✅ Fix token storage in login page
2. ✅ Fix token storage in auth store login method
3. ✅ Fix OAuth callback property check
4. ✅ Fix checkAuth clearing tokens

### Priority 2 (Important - UX Issues):
5. ✅ Fix infinite loop potential in feed page
6. ✅ Improve verify OTP to return full user data
7. ✅ Make temporary OAuth username more obvious

### Priority 3 (Nice to Have):
8. Add rate limiting on OTP endpoints
9. Add account lockout after failed login attempts
10. Add email notification on new device login

---

## 📋 IMPLEMENTATION PLAN:

1. **Fix Frontend Token Storage** (Bugs #1, #2, #7)
   - Update login page to store tokens
   - Update auth store login method
   - Update checkAuth to not clear tokens

2. **Fix OAuth Flow** (Bug #3)
   - Update OAuth callback to check correct property
   - Test full OAuth flow

3. **Fix Feed Loop** (Bug #4)
   - Add loading state check
   - Add redirect guard to prevent loops

4. **Improve Backend Responses** (Bug #5, #6)
   - Update verifyEmailByOtp to return full user + session
   - Update OAuth username generation

5. **Testing**
   - Test all 4 auth flows end-to-end
   - Test edge cases (expired OTP, invalid tokens, etc.)
   - Test concurrent sessions
   - Test logout from all devices

---

## ✅ WHAT'S ALREADY GOOD:

1. ✅ Password hashing with bcrypt (salt 10)
2. ✅ OTP expiry (15 minutes)
3. ✅ HttpOnly cookies for tokens
4. ✅ SameSite=lax for CSRF protection
5. ✅ Email verification required
6. ✅ Session tracking (user agent, IP)
7. ✅ Proper error messages
8. ✅ Database schema complete
9. ✅ Input validation with Zod
10. ✅ Internal API token for server actions

---

## 🚀 NEXT STEPS:

1. Apply all Priority 1 fixes
2. Test each auth flow
3. Apply Priority 2 fixes
4. Full regression testing
5. Deploy to staging
6. Monitor for issues

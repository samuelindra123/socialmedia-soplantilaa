"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { 
  Loader2, 
  CheckCircle2, 
  Mail,
  ArrowRight,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import {
  resendVerificationAction,
  verifyEmailOtpAction,
  verifyEmailTokenAction,
} from "@/app/actions/auth-actions";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>('idle');
  const [boxes, setBoxes] = useState<string[]>(Array(6).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const savedEndTime = localStorage.getItem('resend_otp_end_time');
    if (savedEndTime) {
      const remaining = Math.ceil((parseInt(savedEndTime) - Date.now()) / 1000);
      if (remaining > 0) setCountdown(remaining);
    } else {
      setCountdown(60);
      localStorage.setItem('resend_otp_end_time', (Date.now() + 60000).toString());
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('resend_otp_end_time');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  useEffect(() => {
    const otp = boxes.join("");
    if (otp.length === 6 && !isSubmitting) {
      handleOtpSubmit(new Event('submit') as any);
    }
  }, [boxes]);

  const verifyToken = async (tokenStr: string) => {
    setStatus('verifying');
    try {
      const result = await verifyEmailTokenAction(tokenStr);
      if (!result.ok) throw new Error(result.message);
      setStatus('success');
      toast.success("Email berhasil diverifikasi!");
      await useAuthStore.getState().checkAuth();
      setTimeout(() => router.push('/onboarding'), 2000);
    } catch (error: any) {
      setStatus('error');
      toast.error(error?.message || "Link verifikasi tidak valid");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    const otp = boxes.join("");
    if (otp.length !== 6) return;

    setIsSubmitting(true);
    try {
      if (!userId) throw new Error("User ID tidak ditemukan");
      const result = await verifyEmailOtpAction(userId, otp);
      if (!result.ok) throw new Error(result.message);
      
      // Store full auth data
      useAuthStore.setState({
        user: result.user,
        token: result.accessToken,
        sessionToken: result.sessionToken,
        isAuthenticated: true,
        isLoading: false,
      });
      
      setStatus('success');
      toast.success("Verifikasi berhasil!");
      setTimeout(() => router.push('/onboarding'), 2000);
    } catch (error: any) {
      toast.error(error.message || "Kode OTP salah");
      setBoxes(Array(6).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    setIsResending(true);
    try {
      const result = await resendVerificationAction(email);
      if (!result.ok) throw new Error(result.message);
      toast.success("Kode baru dikirim!");
      setCountdown(60);
      localStorage.setItem('resend_otp_end_time', (Date.now() + 60000).toString());
    } catch (error: any) {
      toast.error(error.message || "Gagal kirim ulang");
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newBoxes = [...boxes];
    newBoxes[index] = value.slice(-1);
    setBoxes(newBoxes);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !boxes[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-slate-900 mx-auto mb-4" />
          <p className="text-slate-600">Memverifikasi...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Berhasil!</h2>
          <p className="text-slate-600">Redirect ke onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 font-sans selection:bg-slate-200">
      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        
        {/* LEFT SIDE - BRANDING */}
        <div className="hidden lg:block space-y-6 px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <span className="text-4xl font-bold tracking-tight text-slate-900 [font-family:var(--font-marketing-display,system-ui)]">
              Soplantila
            </span>
          </div>
          
          <h1 className="text-5xl font-bold text-slate-900 leading-tight tracking-tight [font-family:var(--font-marketing-display,system-ui)]">
            Verifikasi email lo
          </h1>
          
          <p className="text-xl text-slate-600 leading-relaxed">
            Cek inbox email lo, kami kirim kode verifikasi 6 digit. Masukkin kodenya di sini.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Cek Email</div>
                <div className="text-xs text-slate-500">Inbox atau spam</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                <svg className="h-5 w-5 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Kode Expire</div>
                <div className="text-xs text-slate-500">10 menit</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - VERIFY FORM */}
        <div className="w-full max-w-[400px] mx-auto lg:mx-0">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 p-8 lg:p-10">
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-slate-900 [font-family:var(--font-marketing-display,system-ui)]">
                Soplantila
              </span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Masukkan kode OTP</h2>
              <p className="text-sm text-slate-500">
                Kode dikirim ke <span className="font-semibold text-slate-900">{email}</span>
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="flex gap-2 justify-center">
                {boxes.map((box, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputsRef.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={box}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-200 focus:border-slate-900 rounded-xl focus:outline-none focus:bg-white transition-all"
                  />
                ))}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || boxes.join("").length !== 6}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-lg shadow-slate-900/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verifikasi
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || isResending}
                  className="text-sm font-semibold text-slate-900 hover:underline disabled:text-slate-400 disabled:no-underline flex items-center justify-center gap-2 mx-auto"
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {countdown > 0 ? `Kirim ulang (${countdown}s)` : 'Kirim ulang kode'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 text-center bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
            <p className="text-sm text-slate-600">
              Salah email?{' '}
              <Link href="/signup" className="font-bold text-slate-900 hover:underline">
                Daftar ulang
              </Link>
            </p>
          </div>

          <div className="mt-6 flex justify-center items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Kode terenkripsi & aman</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Mail,
  ArrowRight,
  RefreshCw,
  Clock,
  AlertCircle
} from "lucide-react";
import Logo from "@/components/Logo";
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
  const [errorMessage, setErrorMessage] = useState("");
  const [boxes, setBoxes] = useState<string[]>(Array(8).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Initialize timer from localStorage on mount
  useEffect(() => {
    const savedEndTime = localStorage.getItem('resend_otp_end_time');
    if (savedEndTime) {
      const remaining = Math.ceil((parseInt(savedEndTime) - Date.now()) / 1000);
      if (remaining > 0) {
        setCountdown(remaining);
        setCanResend(false);
      } else {
        setCountdown(0);
        setCanResend(true);
      }
    } else {
      // First visit or no timer, start with 60s
      startTimer(60);
    }
  }, []);

  const startTimer = (seconds: number) => {
    const endTime = Date.now() + seconds * 1000;
    localStorage.setItem('resend_otp_end_time', endTime.toString());
    setCountdown(seconds);
    setCanResend(false);
  };

  // Countdown timer logic
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            localStorage.removeItem('resend_otp_end_time');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  // Auto verify if token exists
  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setStatus('idle');
    }
  }, [token]);

  // Auto-submit when all fields filled
  useEffect(() => {
    const otp = boxes.join("");
    if (otp.length === 8 && !isSubmitting) {
      handleOtpSubmit(new Event('submit') as any);
    }
  }, [boxes]);

  const verifyToken = async (tokenStr: string) => {
    setStatus('verifying');
    try {
      const result = await verifyEmailTokenAction(tokenStr);
      if (!result.ok) {
        throw new Error(result.message);
      }
      setStatus('success');
      toast.success("Email berhasil diverifikasi!");

      await useAuthStore.getState().checkAuth();

      setTimeout(() => router.push('/onboarding'), 2000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error?.message || "Link verifikasi tidak valid atau sudah kadaluarsa");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    const otp = boxes.join("");
    if (otp.length !== 8) return;

    setIsSubmitting(true);
    try {
      if (!userId) {
        throw new Error("User ID tidak ditemukan. Silakan login ulang atau gunakan link verifikasi dari email.");
      }

      const result = await verifyEmailOtpAction(userId, otp);
      if (!result.ok) {
        throw new Error(result.message);
      }
      
      setStatus('success');
      toast.success("Verifikasi berhasil!");

      await useAuthStore.getState().checkAuth();

      setTimeout(() => router.push('/onboarding'), 2000);
    } catch (error: any) {
      const serverMessage = error.response?.data?.message;
      const errorMsg = serverMessage === "OTP tidak valid" 
        ? "Kode OTP salah, pastikan Anda memasukkan kode terbaru" 
        : serverMessage || "Terjadi kesalahan saat verifikasi";
      
      toast.error(errorMsg);
      
      // Only clear boxes if OTP is invalid, not for other errors
      if (serverMessage === "OTP tidak valid") {
        setBoxes(Array(8).fill(""));
        inputsRef.current[0]?.focus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;

    setIsResending(true);
    try {
      const result = await resendVerificationAction(email);
      if (!result.ok) {
        throw new Error(result.message);
      }
      toast.success("Kode verifikasi baru telah dikirim!");
      startTimer(60);
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengirim ulang kode");
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^[a-zA-Z0-9]*$/.test(value)) return;

    const newBoxes = [...boxes];
    newBoxes[index] = value.slice(-1).toUpperCase(); // Take only last char and uppercase
    setBoxes(newBoxes);

    // Move focus forward
    if (value && index < 7) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    // Clean first (remove spaces/symbols), then slice to ensure we get 8 valid chars
    const pastedData = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
    
    if (pastedData) {
      const newBoxes = [...boxes];
      pastedData.split('').forEach((char, i) => {
        if (i < 8) newBoxes[i] = char;
      });
      setBoxes(newBoxes);
      
      // Focus last filled or first empty
      const nextEmpty = newBoxes.findIndex(b => !b);
      const focusIndex = nextEmpty === -1 ? 7 : nextEmpty;
      inputsRef.current[focusIndex]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!boxes[index] && index > 0) {
        const next = [...boxes];
        next[index - 1] = '';
        setBoxes(next);
        inputsRef.current[index - 1]?.focus();
      } else {
        const next = [...boxes];
        next[index] = '';
        setBoxes(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
          <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-slate-900 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Memverifikasi...</h2>
        <p className="text-slate-500">Mohon tunggu sebentar, kami sedang memvalidasi link Anda.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifikasi Berhasil!</h2>
        <p className="text-slate-500 mb-8">Akun Anda telah aktif. Mengalihkan ke halaman onboarding...</p>
        <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-green-500 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifikasi Gagal</h2>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto">{errorMessage}</p>
        <Link 
          href="/login"
          className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all"
        >
          Kembali ke Login
        </Link>
      </div>
    );
  }

  // Default: OTP Input View
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl mb-6 border border-slate-100 shadow-sm">
          <Mail className="w-8 h-8 text-slate-900" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Cek Email Anda</h1>
        <p className="text-slate-500 text-sm">
          Kami telah mengirimkan kode verifikasi 8 digit ke <br/>
          <span className="font-bold text-slate-900">{email}</span>
        </p>
      </div>

      <form onSubmit={handleOtpSubmit} className="space-y-8">
        {/* OTP Inputs */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {boxes.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputsRef.current[index] = el }}
              type="text"
              inputMode="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-9 h-12 sm:w-11 sm:h-14 text-center text-xl font-bold bg-white border-2 rounded-xl outline-none transition-all ${
                digit 
                  ? 'border-slate-900 text-slate-900 shadow-sm' 
                  : 'border-slate-200 text-slate-400 focus:border-slate-400'
              }`}
            />
          ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || boxes.some(b => !b)}
          className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Verifikasi
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Resend Timer */}
        <div className="text-center">
          {canResend ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Tidak menerima kode?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center justify-center gap-2 mx-auto"
              >
                {isResending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Kirim Ulang Kode
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs font-mono text-slate-500">
                Kirim ulang dalam {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      </form>

      {/* Help Link */}
      <div className="mt-8 text-center">
        <Link href="/help" className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Butuh bantuan? Hubungi Support
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Header */}
      <header className="px-6 py-6 flex justify-center border-b border-slate-50">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo variant="full" height={28} />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
            <p className="text-slate-500 mt-4">Memuat halaman verifikasi...</p>
          </div>
        }>
          <VerifyContent />
        </Suspense>
      </main>
    </div>
  );
}

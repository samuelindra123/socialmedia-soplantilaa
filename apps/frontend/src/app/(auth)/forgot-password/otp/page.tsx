"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import Logo from "@/components/Logo";
import {
  forgotPasswordRequestAction,
  forgotPasswordVerifyOtpAction,
} from "@/app/actions/auth-actions";

const OTP_LENGTH = 6;

function ForgotPasswordOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedEmail =
      (typeof window !== "undefined" && sessionStorage.getItem("reset_email")) ||
      searchParams.get("email");
    if (!storedEmail) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(storedEmail);
  }, [router, searchParams]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]*$/.test(value)) return;
    const updated = [...otpValues];
    updated[index] = value.slice(-1);
    setOtpValues(updated);
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const updated = Array(OTP_LENGTH)
      .fill("")
      .map((_, idx) => pasted[idx] || "");
    setOtpValues(updated);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const otp = otpValues.join("");
    if (otp.length !== OTP_LENGTH) {
      toast.error("Masukkan 6 digit OTP");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await forgotPasswordVerifyOtpAction(email, otp);
      if (!result.ok) {
        throw new Error(result.message);
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("reset_token", result.resetToken);
        sessionStorage.setItem("reset_email", email);
      }
      toast.success("OTP valid, lanjutkan buat password baru");
      router.push("/forgot-password/new-password");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        (err instanceof Error ? err.message : "OTP tidak valid");
      toast.error(message);
      setOtpValues(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setIsResending(true);
    try {
      const result = await forgotPasswordRequestAction(email);
      if (!result.ok) {
        throw new Error(result.message);
      }
      toast.success("Kode baru dikirim");
      setCountdown(60);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        (err instanceof Error ? err.message : "Gagal mengirim ulang kode");
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-white dark:bg-slate-950">
      <div className="flex flex-col px-6 md:px-12 lg:px-20 py-10">
        <div className="mb-10">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <Logo variant="full" height={32} />
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Verifikasi OTP</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2 mb-2">Masukkan kode 6 digit</h1>
            {email && (
              <p className="text-sm text-slate-500">
                Kode OTP dikirim ke <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2">
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={value}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="h-12 w-12 rounded-2xl border border-slate-200 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 dark:bg-slate-900 dark:text-white"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verifikasi kode"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || countdown > 0}
              className="inline-flex items-center gap-2 font-semibold text-slate-900 hover:underline disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
              {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : "Kirim ulang kode"}
            </button>
            <Link href="/forgot-password" className="font-semibold text-slate-900 hover:underline">
              Ganti email
            </Link>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.4em] text-slate-400">
          <ShieldCheck className="h-3 w-3" />
          <span>OTP terenkripsi</span>
        </div>
      </div>

      <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 lg:flex">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '36px 36px',
        }} />
        <div className="relative z-10 max-w-md text-center text-white">
          <p className="text-2xl font-semibold mb-4">
            &ldquo;Keamanan akun dimulai dari kehati-hatianmu menjaga kode rahasia.&rdquo;
          </p>
          <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/80">
            Renunganku Security
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
          <div className="flex flex-col items-center gap-3 text-slate-600 dark:text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm font-medium">Memuat halaman verifikasi OTP...</p>
          </div>
        </div>
      }
    >
      <ForgotPasswordOtpContent />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Mail, Loader2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { forgotPasswordRequestAction } from "@/app/actions/auth-actions";

const schema = z.object({
  email: z.string().email("Format email tidak valid"),
});

type ForgotForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ForgotForm) => {
    setServerError(null);
    const toastId = toast.loading("Mengirim kode...");
    try {
      const result = await forgotPasswordRequestAction(data.email);
      if (!result.ok) throw new Error(result.message);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("reset_email", data.email);
      }
      toast.success("Kode OTP dikirim ke email!", { id: toastId });
      router.push("/forgot-password/otp");
    } catch (err) {
      const message = (err instanceof Error ? err.message : "Gagal kirim permintaan");
      setServerError(message);
      toast.error(message, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 font-sans selection:bg-slate-200">
      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        
        <div className="hidden lg:block space-y-6 px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <span className="text-4xl font-bold tracking-tight text-slate-900 [font-family:var(--font-marketing-display,system-ui)]">Soplantila</span>
          </div>
          
          <h1 className="text-5xl font-bold text-slate-900 leading-tight tracking-tight [font-family:var(--font-marketing-display,system-ui)]">Lupa password?</h1>
          <p className="text-xl text-slate-600 leading-relaxed">Gak masalah, kami bantu reset. Masukkin email lo dan kami kirim kode verifikasi.</p>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Reset Aman</div>
                <div className="text-xs text-slate-500">Terverifikasi</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Via Email</div>
                <div className="text-xs text-slate-500">Cepat & mudah</div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[400px] mx-auto lg:mx-0">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 p-8 lg:p-10">
            
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-slate-900 [font-family:var(--font-marketing-display,system-ui)]">Soplantila</span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset password</h2>
              <p className="text-sm text-slate-500">Masukkan email akun lo</p>
            </div>

            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <input 
                  {...register("email")}
                  type="email" 
                  placeholder="Email" 
                  className={`w-full px-4 py-3.5 bg-slate-50 border ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all`}
                />
                {errors.email && <p className="text-xs text-red-600 ml-1 font-medium">{errors.email.message}</p>}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-lg shadow-slate-900/20"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Kirim kode
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
            <p className="text-sm text-slate-600">
              Inget password?{' '}
              <Link href="/login" className="font-bold text-slate-900 hover:underline">Masuk</Link>
            </p>
          </div>

          <div className="mt-6 flex justify-center items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Reset aman & terenkripsi</span>
          </div>
        </div>

      </div>
    </div>
  );
}

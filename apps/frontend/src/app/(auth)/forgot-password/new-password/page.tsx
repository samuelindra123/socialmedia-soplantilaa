"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Loader2, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";
import { forgotPasswordResetAction } from "@/app/actions/auth-actions";

const schema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter")
    .regex(/[a-z]/, "Harus ada huruf kecil")
    .regex(/[A-Z]/, "Harus ada huruf besar")
    .regex(/[0-9]/, "Harus ada angka"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type NewPasswordForm = z.infer<typeof schema>;

function NewPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NewPasswordForm>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const storedToken = (typeof window !== "undefined" && sessionStorage.getItem("reset_token")) || searchParams.get("token");
    if (!storedToken) {
      toast.error("Token tidak ditemukan");
      router.push("/forgot-password");
      return;
    }
    setToken(storedToken);
  }, [searchParams, router]);

  const onSubmit = async (data: NewPasswordForm) => {
    if (!token) return;
    setServerError(null);
    const toastId = toast.loading("Mereset password...");
    try {
      const result = await forgotPasswordResetAction(token, data.password);
      if (!result.ok) throw new Error(result.message);
      toast.success("Password berhasil direset!", { id: toastId });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("reset_email");
        sessionStorage.removeItem("reset_token");
      }
      router.push("/login");
    } catch (err) {
      const message = (err instanceof Error ? err.message : "Gagal reset password");
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
          
          <h1 className="text-5xl font-bold text-slate-900 leading-tight tracking-tight [font-family:var(--font-marketing-display,system-ui)]">Buat password baru</h1>
          <p className="text-xl text-slate-600 leading-relaxed">Bikin yang kuat ya, jangan lupa lagi. Minimal 8 karakter dengan huruf besar dan angka.</p>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Password Kuat</div>
                <div className="text-xs text-slate-500">Min 8 karakter</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Aman</div>
                <div className="text-xs text-slate-500">Terenkripsi</div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[400px] mx-auto lg:mx-0">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 p-8 lg:p-10">
            
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10 Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-slate-900 [font-family:var(--font-marketing-display,system-ui)]">Soplantila</span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Password baru</h2>
              <p className="text-sm text-slate-500">Buat password yang kuat</p>
            </div>

            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <div className="relative">
                  <input 
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password baru" 
                    className={`w-full px-4 py-3.5 pr-12 bg-slate-50 border ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600 ml-1 font-medium">{errors.password.message}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input 
                    {...register("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Konfirmasi password" 
                    className={`w-full px-4 py-3.5 pr-12 bg-slate-50 border ${errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-600 ml-1 font-medium">{errors.confirmPassword.message}</p>}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-lg shadow-slate-900/20 mt-6"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Reset password
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 flex justify-center items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Password terenkripsi & aman</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-900" /></div>}>
      <NewPasswordContent />
    </Suspense>
  );
}

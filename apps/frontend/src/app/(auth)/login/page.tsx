"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import { 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";
import { useAuthStore } from "@/store/auth"; 
import GoogleLogo from "@/components/auth/GoogleLogo";
import { loginAction } from "@/app/actions/auth-actions";
import MaintenanceAuthGuard from "@/components/MaintenanceAuthGuard";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleRedirecting, setGoogleRedirecting] = useState(false);

   useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error");
      if (oauthError !== "google_oauth_unavailable") {
         return;
      }

      const message =
         "Google OAuth sementara tidak tersedia. Periksa konfigurasi Google OAuth di backend.";
      setServerError(message);
      toast.error(message);
   }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    const toastId = toast.loading("Sedang masuk...");

    try {
         const result = await loginAction(data.email, data.password);

         if (!result.ok) {
            throw new Error(result.message);
      }

         useAuthStore.setState({
            user: result.user,
            token: result.accessToken,
            sessionToken: result.sessionToken,
            isAuthenticated: true,
            isLoading: false,
         });

         toast.success("Berhasil masuk!", { id: toastId });
         router.push("/feed");
    } catch (err) {
      const raw =
        (err as { response?: { data?: { message?: unknown }; status?: unknown } })
          .response?.data?.message;
         const friendly =
            typeof raw === 'string'
               ? raw
               : err instanceof Error
                  ? err.message
                  : 'Email atau password salah';
      console.error('Login error:', err);
      setServerError(friendly);
      toast.error(friendly, { id: toastId });
    }
  };

  const handleGoogleLogin = () => {
    setGoogleRedirecting(true);
      window.location.href = `/api/auth/google?redirect=${encodeURIComponent("/feed")}&mode=login`;
  };

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
            Sosial media yang gak bikin pusing
          </h1>
          
          <p className="text-xl text-slate-600 leading-relaxed">
            Terhubung dengan teman, berbagi momen, dan nikmati konten tanpa gangguan iklan atau algoritma yang maksa.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Privasi Terjaga</div>
                <div className="text-xs text-slate-500">Data lo aman</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Super Cepat</div>
                <div className="text-xs text-slate-500">Loading instant</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Masuk ke akun lo</h2>
              <p className="text-sm text-slate-500">Lanjutin scroll feed yang kemarin</p>
            </div>

            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <MaintenanceAuthGuard action="login">
              
              <div className="space-y-1">
                <div className="relative">
                  <input 
                    {...register("email")}
                    type="email" 
                    placeholder="Email atau username" 
                    className={`w-full px-4 py-3.5 bg-slate-50 border ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-600 ml-1 font-medium">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input 
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password" 
                    className={`w-full px-4 py-3.5 pr-12 bg-slate-50 border ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600 ml-1 font-medium">{errors.password.message}</p>}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-lg shadow-slate-900/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center">
                <Link href="/forgot-password" className="text-sm font-semibold text-slate-900 hover:underline">
                  Lupa password?
                </Link>
              </div>

              <div className="relative flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs text-slate-400 font-medium">ATAU</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleRedirecting}
                className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-3 transition-all disabled:opacity-60"
              >
                {isGoogleRedirecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <GoogleLogo className="h-5 w-5" />
                )}
                Masuk dengan Google
              </button>
              </MaintenanceAuthGuard>
            </form>
          </div>

          <div className="mt-6 text-center bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
            <p className="text-sm text-slate-600">
              Belum punya akun?{' '}
              <Link href="/signup" className="font-bold text-slate-900 hover:underline">
                Daftar
              </Link>
            </p>
          </div>

          <div className="mt-6 flex justify-center items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Koneksi aman & terenkripsi SSL</span>
          </div>
        </div>

      </div>
    </div>
  );
}

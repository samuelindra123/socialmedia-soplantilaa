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
  Mail, 
  Lock, 
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";
import Logo from "@/components/Logo";
import { useAuthStore } from "@/store/auth"; 
import GoogleLogo from "@/components/auth/GoogleLogo";
import { loginAction } from "@/app/actions/auth-actions";

// Validation Schema
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
            token: null,
            sessionToken: null,
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
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-white dark:bg-slate-900 font-sans selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900">
      
      {/* --- LEFT SIDE --- */}
      <div className="flex flex-col h-full min-h-screen px-6 md:px-12 lg:px-24 py-10 bg-white overflow-y-auto">
        <div className="flex-none mb-10 lg:mb-0">
           <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
             <Logo variant="full" height={32} />
           </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto">
           <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                 Selamat datang kembali.
              </h1>
              <p className="text-slate-500 text-sm">
                 Lanjutkan perjalanan refleksi Anda hari ini.
              </p>
           </div>

           {serverError && (
             <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in">
               <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <span>{serverError}</span>
             </div>
           )}

           <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                 <div className="relative group">
                    <input 
                       {...register("email")}
                       type="email" 
                       placeholder="Email address" 
                       className={`w-full pl-11 pr-4 py-3 bg-white border ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-sm`}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                       <Mail className="w-4 h-4" />
                    </div>
                 </div>
                 {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>}

                 <div className="relative group">
                    <input 
                       {...register("password")}
                       type={showPassword ? "text" : "password"}
                       placeholder="Password" 
                       className={`w-full pl-11 pr-11 py-3 bg-white border ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-sm`}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                       <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                 </div>
                 {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between text-sm">
                 <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                        <input type="checkbox" className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow-sm checked:bg-slate-900 checked:border-slate-900 transition-all" />
                        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span className="text-slate-500 font-medium group-hover:text-slate-700">Ingat saya</span>
                 </label>
                 <Link href="/forgot-password" className="font-semibold text-slate-900 hover:underline decoration-slate-300 underline-offset-4">
                    Lupa password?
                 </Link>
              </div>

              <button 
                 type="submit" 
                 disabled={isSubmitting}
                 className="w-full bg-[#0B0C0E] hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                 {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                    <>
                      Masuk
                      <ArrowRight className="w-4 h-4" />
                    </>
                 )}
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleRedirecting}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isGoogleRedirecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GoogleLogo className="h-5 w-5" />
                )}
                Masuk dengan Google
              </button>
           </form>

           <div className="mt-8 text-center text-sm text-slate-500">
              Belum punya akun?{' '}
              <Link href="/signup" className="font-bold text-slate-900 hover:underline">
                 Daftar gratis
              </Link>
           </div>
        </div>

        <div className="flex-none mt-10 text-center flex justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
           <ShieldCheck className="w-3 h-3" />
           <span>Secure SSL Connection</span>
        </div>
      </div>

      {/* --- RIGHT SIDE --- */}
      <div className="hidden lg:flex relative bg-[#050505] items-center justify-center overflow-hidden h-screen sticky top-0">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
         <div className="relative z-10 text-center px-12">
            <h2 className="text-3xl font-serif text-white mb-4 leading-normal">&ldquo;Ketenangan bukanlah saat tidak ada badai, melainkan ketenangan di tengah badai itu sendiri.&rdquo;</h2>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs text-slate-300 border border-white/10">
               <span>Generated by Reflector AI</span>
            </div>
         </div>
      </div>
    </div>
  );
}

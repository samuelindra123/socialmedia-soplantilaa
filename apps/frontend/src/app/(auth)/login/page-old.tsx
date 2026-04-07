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

const loginSchema = z.object({
  email: z.string().email("Format email lo nggak valid nih"),
  password: z.string().min(1, "Password jangan sampe kosong dong"),
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
    const message = "Oops, Google OAuth lagi ngambek. Cek konfigurasi backend ya.";
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
    const toastId = toast.loading("Bentar, lagi nyocokin data...");

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

      toast.success("Mancap! Langsung gas masuk.", { id: toastId });
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
               : 'Aduh, email atau passwordnya ada yang salah nih.';
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
    <div className="relative min-h-screen flex items-center justify-center bg-[#FAFAFA] font-sans selection:bg-slate-200 overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Premium Background FX */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]"></div>
         <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse mix-blend-multiply"></div>
         <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse mix-blend-multiply" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
        
        {/* Logo */}
        <Link href="/" className="mb-8 hover:scale-105 transition-transform duration-300">
           <Logo variant="full" height={36} />
        </Link>

        {/* Floating Auth Card */}
        <div className="w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative">
           
           <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2 [font-family:var(--font-marketing-display,system-ui)]">
                 Welcome Back 👋
              </h1>
              <p className="text-sm font-medium text-slate-500">
                 Lanjutin scroll feed lo yang kemarin belum kelar.
              </p>
           </div>

           {serverError && (
             <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
               <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
               <span className="font-medium">{serverError}</span>
             </div>
           )}

           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="space-y-1">
                 <div className="relative group">
                    <input 
                       {...register("email")}
                       type="email" 
                       placeholder="Email lo" 
                       className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm group-hover:border-slate-300`}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                       <Mail className="w-5 h-5" />
                    </div>
                 </div>
                 {errors.email && <p className="text-xs text-red-600 ml-2 font-semibold">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                 <div className="relative group">
                    <input 
                       {...register("password")}
                       type={showPassword ? "text" : "password"}
                       placeholder="Password rahasia lo" 
                       className={`w-full pl-12 pr-12 py-3.5 bg-white border-2 ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm group-hover:border-slate-300`}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                       <Lock className="w-5 h-5" />
                    </div>
                    <button
                      type="button"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                 </div>
                 {errors.password && <p className="text-xs text-red-600 ml-2 font-semibold">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between text-sm py-2">
                 <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                        <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-slate-300 bg-white checked:bg-slate-900 checked:border-slate-900 transition-all" />
                        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span className="text-slate-600 font-semibold group-hover:text-slate-900 transition-colors">Ingetin gue</span>
                 </label>
                 <Link href="/forgot-password" className="font-bold text-slate-900 hover:text-blue-600 hover:underline decoration-2 underline-offset-4 decoration-blue-200 transition-colors">
                    Lupa password?
                 </Link>
              </div>

              <button 
                 type="submit" 
                 disabled={isSubmitting}
                 className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_30px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_-2px_rgba(0,0,0,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-base mt-2"
              >
                 {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                    <>
                      Masuk Kapten
                      <ArrowRight className="w-5 h-5" />
                    </>
                 )}
              </button>

              <div className="relative flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">ATAU PAKE</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleRedirecting}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-sm"
              >
                {isGoogleRedirecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <GoogleLogo className="h-5 w-5" />
                )}
                Masuk pake Google
              </button>
           </form>

           <p className="mt-8 text-center text-sm font-medium text-slate-600">
              Belum punya akun?{' '}
              <Link href="/signup" className="font-bold text-slate-900 hover:text-blue-600 hover:underline decoration-2 underline-offset-4 transition-colors">
                 Daftar gratis
              </Link>
           </p>

        </div>
      </div>
    </div>
  );
}

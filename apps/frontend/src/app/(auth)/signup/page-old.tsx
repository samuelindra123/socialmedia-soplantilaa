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
  User, 
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";
import Logo from "@/components/Logo";
import GoogleLogo from "@/components/auth/GoogleLogo";
import { registerAction } from "@/app/actions/auth-actions";

const signupSchema = z.object({
  fullName: z.string().min(3, "Bikin nama asli dong, min 3 huruf ya"),
  email: z.string().email("Format email lo agak ngaco nih"),
  password: z.string().min(8, "Password jangan kependekan banget, min 8")
    .regex(/[A-Z]/, "Wajib ada huruf kapitalnya dikit dong")
    .regex(/[0-9]/, "Tambahin angka satu kek biar kuat"),
  terms: z.boolean().refine((val) => val === true, {
    message: "Centang dulu bro Syarat & Ketentuannya",
  }),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
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
    const message = "Yah, Google OAuth-nya lagi tidur. Cek backend gih.";
    setServerError(message);
    toast.error(message);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      terms: false,
    }
  });

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    const toastId = toast.loading("Bikin akun dulu ya...");

    try {
      const result = await registerAction(data.fullName, data.email, data.password);
      if (!result.ok) {
        throw new Error(result.message);
      }

      toast.success("Beres! Lo tinggal cek email ya.", { id: toastId });
      
      const userId = result.userId;
      router.push(`/verify?email=${encodeURIComponent(data.email)}&userId=${encodeURIComponent(userId || '')}`);
      
    } catch (error: unknown) {
      const raw = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
      const translate = (m: string) => {
        if (m.includes("property name should not exist")) return "Nama lo aneh formatnya. Pake Nama Lengkap aja.";
        if (m.includes("namaLengkap must be a string")) return "Nama lengkap wajib bentukan teks.";
        if (m.includes("namaLengkap should not be empty")) return "Tulis dulu nama lo sapa.";
        return m;
      };
      const friendly = Array.isArray(raw)
        ? raw.map((m: string) => translate(m)).join(" • ")
        : typeof raw === "string"
          ? translate(raw)
               : error instanceof Error
                  ? error.message
                  : "Duh error pas daftar nih, coba sekalia lagi.";
      console.error("Registration error:", error);
      setServerError(friendly);
      toast.error(friendly, { id: toastId });
    }
  };

  const handleGoogleSignup = () => {
    if (isGoogleRedirecting) return;
    setGoogleRedirecting(true);
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent("/feed")}&mode=signup`;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#FAFAFA] font-sans selection:bg-slate-200 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      
      {/* Background Magic Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(circle_at_center,black_60%,transparent_100%)]"></div>
         <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[120px] animate-pulse mix-blend-multiply"></div>
         <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[120px] animate-pulse mix-blend-multiply" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-[480px] flex flex-col items-center animate-in fade-in zoom-in-95 duration-700 py-12">
        
        {/* Logo Return */}
        <Link href="/" className="mb-8 hover:scale-105 transition-transform duration-300">
           <Logo variant="full" height={36} />
        </Link>

        {/* Central Glass Card */}
        <div className="w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
           
           <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2 [font-family:var(--font-marketing-display,system-ui)]">
                 Mulai Sekarang 🚀
              </h1>
              <p className="text-sm font-medium text-slate-500">
                 Bikin akun gratis, nggak ribet. Langsung bisa posting.
              </p>
           </div>

           {/* Error Display */}
           {serverError && (
             <div className="mb-6 p-4 bg-red-50/90 backdrop-blur-md border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
               <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
               <span className="font-semibold">{serverError}</span>
             </div>
           )}

           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="space-y-1">
                 <div className="relative group">
                    <input 
                       {...register("fullName")}
                       type="text" 
                       placeholder="Nama lengkap lo" 
                       className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 ${errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm group-hover:border-slate-300`}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                       <User className="w-5 h-5" />
                    </div>
                 </div>
                 {errors.fullName && <p className="text-xs text-red-600 ml-2 font-bold">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1">
                 <div className="relative group">
                    <input 
                       {...register("email")}
                       type="email" 
                       placeholder="Email dipake buat login" 
                       className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm group-hover:border-slate-300`}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                       <Mail className="w-5 h-5" />
                    </div>
                 </div>
                 {errors.email && <p className="text-xs text-red-600 ml-2 font-bold">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                 <div className="relative group">
                    <input 
                       {...register("password")}
                       type={showPassword ? "text" : "password"}
                       placeholder="Bikin password yg kuat" 
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
                 {errors.password && <p className="text-xs text-red-600 ml-2 font-bold">{errors.password.message}</p>}
              </div>

              <div className="space-y-1 pt-2 pb-2">
                 <div className="flex items-start gap-4">
                    <div className="relative flex items-center mt-1 shrink-0">
                        <input 
                          {...register("terms")}
                          type="checkbox" 
                          id="terms"
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-slate-300 bg-white checked:bg-slate-900 checked:border-slate-900 transition-all shadow-sm" 
                        />
                        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <label htmlFor="terms" className="text-sm font-medium text-slate-600 leading-relaxed cursor-pointer select-none">
                       Gue udah baca dan setuju sama <Link href="/terms" className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition-colors">Ketentuan</Link> & <Link href="/privacy" className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition-colors">Privasi</Link> Soplantila.
                    </label>
                 </div>
                 {errors.terms && <p className="text-xs text-red-600 ml-9 font-bold">{errors.terms.message}</p>}
              </div>

              <button 
                 type="submit" 
                 disabled={isSubmitting}
                 className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_30px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_-2px_rgba(0,0,0,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-base mt-2"
              >
                 {isSubmitting ? (
                    <>
                       <Loader2 className="w-5 h-5 animate-spin" />
                       Sabar ya...
                    </>
                 ) : (
                    <>
                      Gass Daftar
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
                onClick={handleGoogleSignup}
                disabled={isGoogleRedirecting}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-sm"
              >
                {isGoogleRedirecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <GoogleLogo className="h-5 w-5" />
                )}
                Daftar kilat pake Google
              </button>
           </form>

           <p className="mt-8 text-center text-sm font-medium text-slate-600">
              Udah ikutan nongkrong?{' '}
              <Link href="/login" className="font-bold text-slate-900 hover:text-blue-600 hover:underline decoration-2 underline-offset-4 transition-colors">
                 Langsung Masuk
              </Link>
           </p>

        </div>
      </div>
    </div>
  );
}

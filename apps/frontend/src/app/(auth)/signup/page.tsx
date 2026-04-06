"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast"; // FIX: Import langsung dari library
import { 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
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

// 1. Validation Schema
const signupSchema = z.object({
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[0-9]/, "Password harus mengandung angka"),
  terms: z.boolean().refine((val) => val === true, {
    message: "Anda harus menyetujui Syarat & Ketentuan",
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

      const message =
         "Google OAuth sementara tidak tersedia. Periksa konfigurasi Google OAuth di backend.";
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
    const toastId = toast.loading("Mendaftarkan akun...");

    try {
         const result = await registerAction(data.fullName, data.email, data.password);

         if (!result.ok) {
            throw new Error(result.message);
         }

      toast.success("Pendaftaran berhasil! Cek email Anda.", { id: toastId });
      
         const userId = result.userId;
      // Redirect ke halaman verifikasi dengan userId untuk OTP
      // Perhatikan parameter 'userId' (bukan 'user') agar sesuai dengan yang dibaca di halaman verify
      router.push(`/verify?email=${encodeURIComponent(data.email)}&userId=${encodeURIComponent(userId || '')}`);
      
    } catch (error: unknown) {
      const raw = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
      const translate = (m: string) => {
        if (m.includes("property name should not exist")) return "Kolom tidak dikenal: 'name'. Gunakan Nama Lengkap.";
        if (m.includes("namaLengkap must be a string")) return "Nama lengkap harus berupa teks.";
        if (m.includes("namaLengkap should not be empty")) return "Nama lengkap wajib diisi.";
        return m;
      };
      const friendly = Array.isArray(raw)
        ? raw.map((m: string) => translate(m)).join(" • ")
        : typeof raw === "string"
          ? translate(raw)
               : error instanceof Error
                  ? error.message
                  : "Terjadi kesalahan saat mendaftar";
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
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-white font-sans selection:bg-slate-900 selection:text-white">
      
      {/* --- LEFT SIDE: SIGNUP FORM --- */}
      <div className="flex flex-col h-full min-h-screen px-6 md:px-12 lg:px-24 py-10 bg-white overflow-y-auto">
        
        <div className="flex-none mb-10 lg:mb-0">
           <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
             <Logo variant="full" height={32} />
           </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto">
           
           <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                 Mulai perjalanan baru.
              </h1>
              <p className="text-slate-500 text-sm">
                 Bergabung dengan komunitas pemikir yang membangun kebiasaan refleksi.
              </p>
           </div>

           {/* Error Alert */}
           {serverError && (
             <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
               <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <span>{serverError}</span>
             </div>
           )}

           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Name Field */}
              <div className="space-y-1">
                 <div className="relative group">
                    <input 
                       {...register("fullName")}
                       type="text" 
                       placeholder="Nama Lengkap" 
                       className={`w-full pl-11 pr-4 py-3 bg-white border ${errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'} rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-sm`}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                       <User className="w-4 h-4" />
                    </div>
                 </div>
                 {errors.fullName && <p className="text-xs text-red-500 ml-1">{errors.fullName.message}</p>}
              </div>

              {/* Email Field */}
              <div className="space-y-1">
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
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                 <div className="relative group">
                    <input 
                       {...register("password")}
                       type={showPassword ? "text" : "password"}
                       placeholder="Password (min. 8 karakter)" 
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

              {/* Legal Terms Checkbox */}
              <div className="space-y-1">
                 <div className="flex items-start gap-3 pt-2">
                    <div className="relative flex items-center mt-1">
                        <input 
                          {...register("terms")}
                          type="checkbox" 
                          id="terms"
                          className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow-sm checked:bg-slate-900 checked:border-slate-900 transition-all" 
                        />
                        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                       Saya menyetujui <Link href="/terms" className="text-slate-900 hover:underline font-medium">Syarat & Ketentuan</Link> serta <Link href="/privacy" className="text-slate-900 hover:underline font-medium">Kebijakan Privasi</Link> Renunganku.
                    </label>
                 </div>
                 {errors.terms && <p className="text-xs text-red-500 ml-1">{errors.terms.message}</p>}
              </div>

              <button 
                 type="submit" 
                 disabled={isSubmitting}
                 className="w-full bg-[#0B0C0E] hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                 {isSubmitting ? (
                    <>
                       <Loader2 className="w-5 h-5 animate-spin" />
                       Memproses...
                    </>
                 ) : (
                    <>
                      Buat Akun
                      <ArrowRight className="w-4 h-4" />
                    </>
                 )}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isGoogleRedirecting}
                className="w-full rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2 disabled:opacity-60 mt-3"
              >
                {isGoogleRedirecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GoogleLogo className="h-5 w-5" />
                )}
                Daftar dengan Google
              </button>
           </form>

           <div className="mt-8 text-center text-sm text-slate-500">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-bold text-slate-900 hover:underline">
                 Masuk sekarang
              </Link>
           </div>
        </div>

        <div className="flex-none mt-10 text-center flex justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
           <ShieldCheck className="w-3 h-3" />
           <span>Encrypted End-to-End</span>
        </div>
      </div>

      {/* --- RIGHT SIDE: BRAND VISUAL --- */}
      <div className="hidden lg:flex relative bg-[#050505] items-center justify-center overflow-hidden h-screen sticky top-0">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]"></div>
         
         <div className="relative z-10 text-center px-12">
            <h2 className="text-4xl font-serif text-white mb-6 leading-tight">&quot;Membangun jati diri dimulai dengan satu kalimat jujur.&quot;</h2>
            <p className="text-slate-400 text-sm tracking-wide uppercase">Mulai langkah kecilmu hari ini</p>
         </div>
      </div>

    </div>
  );
}

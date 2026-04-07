"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import useAuthStore from "@/store/auth";
import { confirmGoogleAction } from "@/app/actions/auth-actions";
import GoogleLogo from "@/components/auth/GoogleLogo";

function GoogleConsentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = searchParams.get("email");
  const googleId = searchParams.get("googleId");
  const name = searchParams.get("name") || "User";
  const redirect = searchParams.get("redirect") || "/feed";

  useEffect(() => {
    if (!email || !googleId) {
      toast.error("Data Google tidak lengkap");
      router.replace("/login");
    }
  }, [email, googleId, router]);

  const handleConfirm = async () => {
    if (!email || !googleId) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Memproses...");

    try {
      const result = await confirmGoogleAction(email, googleId, name);
      if (!result.ok) throw new Error(result.message);

      const token = result.accessToken;
      const sessionToken = result.sessionToken ?? undefined;

      if (!token || !sessionToken) {
        throw new Error("Token tidak ditemukan");
      }

      useAuthStore.setState({
        token,
        sessionToken,
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success("Login berhasil!", { id: toastId });
      router.push(redirect);
    } catch (err) {
      const message = (err instanceof Error ? err.message : "Gagal konfirmasi");
      toast.error(message, { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 font-sans selection:bg-slate-200">
      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        
        <div className="hidden lg:block space-y-6 px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10 Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <span className="text-4xl font-bold tracking-tight text-slate-900 [font-family:var(--font-marketing-display,system-ui)]">Soplantila</span>
          </div>
          
          <h1 className="text-5xl font-bold text-slate-900 leading-tight tracking-tight [font-family:var(--font-marketing-display,system-ui)]">Konfirmasi akun Google</h1>
          <p className="text-xl text-slate-600 leading-relaxed">Kami butuh konfirmasi data lo dari Google untuk melanjutkan.</p>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <GoogleLogo className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Google OAuth</div>
                <div className="text-xs text-slate-500">Aman & cepat</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Data Aman</div>
                <div className="text-xs text-slate-500">Privasi terjaga</div>
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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Konfirmasi data</h2>
              <p className="text-sm text-slate-500">Data dari akun Google lo</p>
            </div>

            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{name}</div>
                  <div className="text-sm text-slate-500">{email}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-lg shadow-slate-900/20"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Konfirmasi & Lanjutkan
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button 
                onClick={() => router.push("/login")}
                disabled={isSubmitting}
                className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60"
              >
                Batal
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-center items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Data lo aman & terenkripsi</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function GoogleConsentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-900" /></div>}>
      <GoogleConsentContent />
    </Suspense>
  );
}

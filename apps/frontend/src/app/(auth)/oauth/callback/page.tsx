"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/auth";

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get("error");
      if (error) {
        toast.error(error === "google_oauth_unavailable" ? "Google OAuth tidak tersedia" : "Login gagal");
        router.push("/login?error=" + error);
        return;
      }

      try {
        await useAuthStore.getState().checkAuth();
        const user = useAuthStore.getState().user;
        
        if (user?.profile?.isOnboardingComplete) {
          toast.success("Login berhasil!");
          router.push("/feed");
        } else {
          router.push("/onboarding");
        }
      } catch (err) {
        toast.error("Gagal memproses login");
        router.push("/login");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-slate-900 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Memproses login...</h2>
        <p className="text-sm text-slate-500">Tunggu sebentar</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}

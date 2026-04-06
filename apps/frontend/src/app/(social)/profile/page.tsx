"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/auth";
import { Loader2 } from "lucide-react";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Pastikan data user terbaru
    checkAuth();
  }, []); // Jalankan sekali saat mount

  useEffect(() => {
    if (isLoading) return;

    if (user?.profile?.username) {
      // Skenario 1: Data lengkap -> Redirect ke profil
      router.replace(`/profile/${user.profile.username}`);
    } else if (user) {
      // Skenario 2: User login tapi username kosong -> Coba fetch ulang max 3 kali
      if (retryCount < 3) {
        const timeout = setTimeout(() => {
            checkAuth();
            setRetryCount(prev => prev + 1);
        }, 1000);
        return () => clearTimeout(timeout);
      } else {
        // Menyerah, lempar ke feed atau settings
        console.error("Gagal memuat username profile setelah 3x percobaan");
        router.replace("/feed");
      }
    } else {
      // Skenario 3: Tidak ada user (belum login) -> Redirect login
      // router.replace("/login"); // Middleware biasanya sudah handle ini
    }
  }, [user, isLoading, router, checkAuth, retryCount]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        <p className="text-sm text-slate-500 font-medium">Mengambil data profil...</p>
      </div>
    </div>
  );
}

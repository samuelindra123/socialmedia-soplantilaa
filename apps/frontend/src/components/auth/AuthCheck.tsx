"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/auth';
import { Loader2 } from 'lucide-react';

// Daftar halaman publik (tidak butuh login)
const PUBLIC_PATHS = [
  '/', '/login', '/signup', '/verify', 
  '/terms', '/privacy', '/roadmap', 
  '/manifesto', '/early-access', '/changelog', '/forgot-password'
];

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, checkAuth, isLoading, isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setIsHydrated(true);
    };
    init();
  }, [checkAuth]);

  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/blog');

  // Tampilkan loading screen hanya jika:
  // 1. Belum selesai rehidrasi state (init), ATAU
  // 2. Sedang fetching profile (isLoading), DAN
  // 3. Kita berada di rute private (agar rute public terasa instan)
  if ((!isHydrated || (isLoading && !isAuthenticated)) && !isPublic) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
            <p className="text-sm text-slate-500 font-medium animate-pulse">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Jika di rute private tapi tidak ada token (Double check selain Middleware)
  if (!isPublic && !token && isHydrated) {
    // router.replace('/login'); // Opsional, middleware biasanya sudah handle
    return null;
  }

  return <>{children}</>;
}
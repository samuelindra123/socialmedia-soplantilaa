"use client";

import { ReactNode, useEffect, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import QueryProvider from "@/providers/query-provider";
import ToastProvider from "@/providers/toast-provider";
import { NotificationsSocketProvider } from "@/providers/notifications-socket-provider";
import { useThemeStore, resolveEffectiveTheme } from "@/store/theme";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function SocialLayout({ children }: { children: ReactNode }) {
  const preference = useThemeStore((s) => s.preference);
  const hasHydrated = useThemeStore((s) => s._hasHydrated);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine effective theme
  const effectiveTheme = mounted && hasHydrated ? resolveEffectiveTheme(preference) : 'light';
  const isDark = effectiveTheme === 'dark';
  
  return (
    <div 
      className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen ${isDark ? 'dark bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
      style={{ colorScheme: effectiveTheme }}
    > 
      <QueryProvider>
        <NotificationsSocketProvider>
          {children}
          <ToastProvider />
        </NotificationsSocketProvider>
      </QueryProvider>
    </div>
  );
}


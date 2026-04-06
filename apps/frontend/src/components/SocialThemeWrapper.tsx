"use client";

import { ReactNode } from "react";
import { useThemeStore, resolveEffectiveTheme } from "@/store/theme";

interface SocialThemeWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function SocialThemeWrapper({ children, className = "" }: SocialThemeWrapperProps) {
  const preference = useThemeStore((s) => s.preference);
  const hasHydrated = useThemeStore((s) => s._hasHydrated);
  const effectiveTheme = hasHydrated ? resolveEffectiveTheme(preference) : "light";
  const isDark = effectiveTheme === 'dark';
  
  return (
    <div className={isDark ? 'dark' : ''} style={{ colorScheme: effectiveTheme }}>
      <div className={className}>
        {children}
      </div>
    </div>
  );
}

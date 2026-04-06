"use client";

import Link from "next/link";
import { Bell, MessageCircle, Plus, BookOpen, Home } from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useNotificationStore } from "@/store/notifications";
import { useThemeStore } from "@/store/theme";
import { SunMoon, Monitor, Moon } from "lucide-react";

interface SocialHeaderProps {
  title?: string;
  description?: string;
  onCreatePost?: () => void;
  rightSlot?: ReactNode;
  className?: string;
}

export default function SocialHeader({
  title,
  description,
  onCreatePost,
  rightSlot,
  className,
}: SocialHeaderProps) {
  const unreadMessages = useNotificationStore((s) => s.unreadMessageCount);
  const followRequestCount = useNotificationStore((s) => s.followRequestCount);
  const { preference, setPreference } = useThemeStore();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!isThemeMenuOpen) return;
    const handler = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isThemeMenuOpen]);

  const themeOptions = [
    { label: "Sistem", value: "system" as const, icon: Monitor },
    { label: "Terang", value: "light" as const, icon: SunMoon },
    { label: "Gelap", value: "dark" as const, icon: Moon },
  ];

  return (
    <div
      className={cn(
        "md:hidden sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-950/80",
        className
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/feed" className="flex items-center gap-2">
          <Logo variant="full" height={24} className="text-slate-900 dark:text-white" colored={false} />
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/alkitab"
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            aria-label="Ruang Alkitab"
          >
            <BookOpen className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={() => onCreatePost?.()}
            className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-2 text-white shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-40"
            aria-label="Buat postingan"
            disabled={!onCreatePost}
          >
            <Plus className="h-5 w-5" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen((prev) => !prev)}
              className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-haspopup="true"
              aria-expanded={isThemeMenuOpen}
            >
              <SunMoon className="h-5 w-5" />
            </button>
            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-2 z-50">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = hasMounted && preference === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setPreference(option.value);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        isActive ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Link
            href="/notifications"
            className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Notifikasi"
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            {followRequestCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-4 min-w-[1rem] rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold text-white">
                {followRequestCount > 99 ? "99+" : followRequestCount}
              </span>
            )}
          </Link>
          <Link
            href="/messages"
            className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Pesan"
          >
            <MessageCircle className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            {unreadMessages > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-4 min-w-[1rem] rounded-full bg-blue-500 px-1 text-center text-[10px] font-semibold text-white">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
          </Link>
          {rightSlot}
        </div>
      </div>
      {(title || description) && (
        <div className="px-4 pb-3">
          {title && (
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
          )}
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Compass, Bookmark, Bell, MessageCircle,
  Settings, LogOut, BookOpen, User,
} from "lucide-react";
import useAuthStore from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import SmartImage from "@/components/ui/SmartImage";

const NAV = [
  { href: "/feed", icon: Home, label: "Beranda" },
  { href: "/discover", icon: Compass, label: "Jelajahi" },
  { href: "/notifications", icon: Bell, label: "Notifikasi", badge: "follow" },
  { href: "/messages", icon: MessageCircle, label: "Pesan", badge: "message" },
  { href: "/alkitab", icon: BookOpen, label: "Alkitab" },
  { href: "/settings", icon: Settings, label: "Pengaturan" },
];

export default function SoplaLeftSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const unreadMessages = useNotificationStore((s) => s.unreadMessageCount);
  const followCount = useNotificationStore((s) => s.followRequestCount);

  const badge = (type?: string) => {
    if (type === "message") return unreadMessages;
    if (type === "follow") return followCount;
    return 0;
  };

  return (
    <aside className="hidden md:flex sticky top-[60px] h-[calc(100vh-60px)] w-64 flex-shrink-0 flex-col justify-between py-4 px-3 overflow-y-auto">
      {/* Profile card */}
      {user && (
        <Link
          href={`/profile/${user.profile?.username}`}
          className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors mb-2 group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 ring-2 ring-indigo-200 dark:ring-indigo-500/30">
            {user.profile?.profileImageUrl ? (
              <SmartImage
                src={user.profile.profileImageUrl}
                alt={user.namaLengkap}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white font-bold text-sm">
                {user.namaLengkap?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {user.namaLengkap}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              @{user.profile?.username}
            </p>
          </div>
        </Link>
      )}

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label, badge: b }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const count = badge(b);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className="min-w-[20px] h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
        <p className="mt-3 px-3 text-[11px] text-slate-400 dark:text-slate-600 leading-relaxed">
          © 2026 Soplantila · <Link href="/privacy" className="hover:underline">Privasi</Link> · <Link href="/terms" className="hover:underline">Ketentuan</Link>
        </p>
      </div>
    </aside>
  );
}

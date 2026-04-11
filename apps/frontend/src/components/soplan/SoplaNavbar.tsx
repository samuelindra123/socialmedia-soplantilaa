"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bell, MessageCircle, Search, PenSquare } from "lucide-react";
import useAuthStore from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import SmartImage from "@/components/ui/SmartImage";
import Logo from "@/components/Logo";
import { useState, useRef, useEffect } from "react";
import CreatePostModal from "@/components/feed/CreatePostModal";

const NAV = [
  { href: "/feed", icon: Home, label: "Beranda" },
  { href: "/discover", icon: Compass, label: "Jelajahi" },
  { href: "/notifications", icon: Bell, label: "Notifikasi", badge: "follow" },
  { href: "/messages", icon: MessageCircle, label: "Pesan", badge: "message" },
];

export default function SoplaNavbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const unreadMessages = useNotificationStore((s) => s.unreadMessageCount);
  const followCount = useNotificationStore((s) => s.followRequestCount);
  const [compose, setCompose] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const badge = (type?: string) => {
    if (type === "message") return unreadMessages;
    if (type === "follow") return followCount;
    return 0;
  };

  return (
    <>
      <header className="hidden md:flex fixed top-0 inset-x-0 z-50 h-[60px] bg-white/95 dark:bg-[#0F0F10]/95 backdrop-blur border-b border-slate-100 dark:border-white/[0.06] items-center px-5 gap-3">
        {/* Brand */}
        <Link href="/feed" className="flex items-center gap-2.5 flex-shrink-0 mr-2">
          <Logo variant="icon" height={32} colored />
          <span className="font-bold text-[17px] tracking-tight text-slate-900 dark:text-white hidden lg:block">
            Soplantila
          </span>
        </Link>

        {/* Search */}
        <div
          className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.07] rounded-xl px-3 h-9 w-56 cursor-text"
          onClick={() => searchRef.current?.focus()}
        >
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={searchRef}
            placeholder="Cari..."
            className="bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none w-full"
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 flex items-center justify-center gap-1">
          {NAV.map(({ href, icon: Icon, label, badge: b }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const count = badge(b);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`relative flex items-center justify-center w-12 h-10 rounded-xl transition-all ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                <Icon className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Compose */}
          <button
            onClick={() => setCompose(true)}
            className="flex items-center gap-2 h-9 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            <PenSquare className="w-4 h-4" />
            <span className="hidden lg:block">Tulis</span>
          </button>

          {/* Avatar */}
          {user && (
            <Link
              href={`/profile/${user.profile?.username}`}
              className="flex items-center gap-2 h-9 px-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 ring-2 ring-indigo-200 dark:ring-indigo-500/30">
                {user.profile?.profileImageUrl ? (
                  <SmartImage
                    src={user.profile.profileImageUrl}
                    alt={user.namaLengkap}
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white text-xs font-bold">
                    {user.namaLengkap?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[72px] truncate hidden lg:block">
                {user.namaLengkap?.split(" ")[0]}
              </span>
            </Link>
          )}
        </div>
      </header>

      <CreatePostModal isOpen={compose} onClose={() => setCompose(false)} />
    </>
  );
}

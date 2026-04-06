"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Search, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/auth";

interface MobileNavProps {
  className?: string;
}

export default function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const profileHref = user?.profile?.username
    ? `/profile/${user.profile.username}`
    : user?.id
      ? `/profile/${user.id}`
      : "/profile";

  const navItems = [
    { href: "/feed", label: "Beranda", icon: Home },
    { href: "/discover", label: "Jelajah", icon: Compass },
    { href: "/search", label: "Cari", icon: Search },
    { href: "/messages", label: "Pesan", icon: MessageCircle },
    { href: profileHref, label: "Profil", icon: User },
  ];

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-950/80",
        className
      )}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.25rem)" }}
    >
      <div className="mx-auto flex max-w-xl items-end justify-between px-6 py-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400",
                isActive && "text-blue-600 dark:text-blue-400"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  isActive ? "bg-blue-50 dark:bg-blue-500/10" : "bg-transparent"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

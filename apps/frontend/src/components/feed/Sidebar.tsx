"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useNotificationStore } from "@/store/notifications";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  User,
  LogOut,
  Settings,
  Compass,
  BookOpen,
  MessageCircle,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  ChevronRight
} from "lucide-react";
import Logo from "@/components/Logo";
import useAuthStore from "@/store/auth";
import CreatePostModal from "./CreatePostModal";
import { useThemeStore } from "@/store/theme";
import { SunMoon, Monitor, Moon } from "lucide-react";
import PendingRequestsWidget from "@/components/notifications/PendingRequestsWidget";
import { apiClient } from "@/lib/api/client";

interface SidebarProps {
  onUploadClick?: () => void;
}

export default function Sidebar({ onUploadClick }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { preference, setPreference } = useThemeStore();
  const unreadMessages = useNotificationStore((state) => state.unreadMessageCount);
  const followRequestCount = useNotificationStore((state) => state.followRequestCount);
  const setUnreadMessageCount = useNotificationStore((state) => state.setUnreadMessageCount);
  const setFollowRequestCount = useNotificationStore((state) => state.setFollowRequestCount);
  const [mounted, setMounted] = useState(false);
  
  // Initialize realtime notifications
  useRealtimeNotifications();
  
  // Avoid hydration mismatch by only reflecting preference after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Fetch unread message count
  const { data: unreadCount } = useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<number>("/messages/unread-count");
        return response.data ?? 0;
      } catch {
        return 0;
      }
    },
    enabled: !!user?.id,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  // Fetch follow request count
  const { data: followRequestData } = useQuery({
    queryKey: ["follow-requests", "count"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: unknown[]; total: number }>("/notifications/follow", {
          params: { limit: 1 },
        });
        return response.data.total ?? 0;
      } catch {
        return 0;
      }
    },
    enabled: !!user?.id,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (typeof unreadCount === 'number') {
      setUnreadMessageCount(unreadCount);
    }
  }, [unreadCount, setUnreadMessageCount]);

  useEffect(() => {
    if (typeof followRequestData === 'number') {
      setFollowRequestCount(followRequestData);
    }
  }, [followRequestData, setFollowRequestCount]);
  
  // State for internal CreatePostModal
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  
  // State for Discover Dropdown
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);
  
  // Active filter state (persisted via URL or local state if needed, 
  // but for now we'll just use it to highlight the dropdown selection)
  // Ideally this should be managed via URL query params like ?type=text or ?type=media
  const handleCreatePostClick = () => {
    if (onUploadClick) {
      onUploadClick();
    } else {
      setIsCreatePostOpen(true);
    }
  };

  const toggleDiscover = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDiscoverOpen(!isDiscoverOpen);
  };

  const showMessageBadge = unreadMessages > 0 && !pathname.startsWith('/chat') && !pathname.startsWith('/messages');

  useEffect(() => {
    if (!user?.id) {
      setUnreadMessageCount(0);
    }
  }, [user?.id, setUnreadMessageCount]);

  const menuItems = [
    { icon: Home, label: "Beranda", href: "/feed" },
    { icon: Search, label: "Cari Pengguna", href: "/search" },
    { 
      icon: Compass, 
      label: "Jelajahi", 
      href: "/discover",
      hasDropdown: true,
      isOpen: isDiscoverOpen,
      onToggle: toggleDiscover,
      subItems: [
        { label: "Semua", href: "/discover", icon: Compass },
        { label: "Postingan Teks", href: "/discover?type=text", icon: FileText },
        { label: "Postingan Media", href: "/discover?type=media", icon: ImageIcon },
      ]
    },
    { icon: BookOpen, label: "Alkitab", href: "/alkitab" },
    { icon: MessageCircle, label: "Pesan", href: "/messages" },
    { icon: Heart, label: "Notifikasi", href: "/notifications" },
    { icon: Settings, label: "Pengaturan", href: "/pengaturan" },
    { icon: PlusSquare, 
      label: "Buat Postingan", 
      href: "#", 
      onClick: handleCreatePostClick 
    },
    { 
      icon: User, 
      label: "Profil", 
      href: user?.profile?.username 
        ? `/profile/${user.profile.username}` 
        : (user?.id ? `/profile/${user.id}` : "/profile") 
    },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-6 z-50 overflow-y-auto">
        {/* Logo Area */}
        <div className="mb-8 px-4">
          <Link href="/feed" className="block hover:opacity-80 transition-opacity">
            <Logo variant="full" height={32} />
          </Link>
        </div>

        <div className="flex-1 flex flex-col space-y-6">
          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const isActive = item.href === '/notifications'
                ? pathname.startsWith('/notifications')
                : pathname === item.href;
              const Icon = item.icon;
              
              if (item.hasDropdown) {
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={item.onToggle}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 group hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        isActive || pathname.startsWith('/discover') ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Icon 
                          className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                            isActive || pathname.startsWith('/discover') ? "text-slate-900 dark:text-white stroke-[2.5px]" : "text-slate-500 dark:text-slate-400"
                          }`} 
                        />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${item.isOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    {item.isOpen && (
                      <div className="pl-12 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {item.subItems?.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <subItem.icon className="w-4 h-4" />
                            <span>{subItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={item.label}>
                  {item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 group hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        isActive ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Icon 
                          className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                            isActive ? "text-slate-900 dark:text-white stroke-[2.5px]" : "text-slate-500 dark:text-slate-400"
                          }`} 
                        />
                        <span>{item.label}</span>
                        {item.label === "Pesan" && showMessageBadge && (
                          <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                          </span>
                        )}
                      </div>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 group hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        isActive ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Icon 
                          className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                            isActive ? "text-slate-900 dark:text-white stroke-[2.5px]" : "text-slate-500 dark:text-slate-400"
                          }`} 
                        />
                        <span>{item.label}</span>
                        {item.label === "Pesan" && showMessageBadge && (
                          <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                          </span>
                        )}
                        {item.label === "Notifikasi" && followRequestCount > 0 && !pathname.startsWith('/notifications') && (
                          <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                            {followRequestCount > 99 ? '99+' : followRequestCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          <PendingRequestsWidget />
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-2">
          {/* Appearance */}
          <div className="px-2">
            <details className="group">
              <summary className="flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer text-[15px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 sticky bottom-0 bg-white dark:bg-slate-900" suppressHydrationWarning>
                <div className="flex items-center gap-3">
                  <SunMoon className="w-5 h-5" />
                  <span>Tampilan</span>
                </div>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-2 space-y-1 px-2">
                <button
                  onClick={() => setPreference('system')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${mounted && preference==='system' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                  suppressHydrationWarning
                >
                  <Monitor className="w-4 h-4" /> Sistem
                </button>
                <button
                  onClick={() => setPreference('light')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${mounted && preference==='light' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                  suppressHydrationWarning
                >
                  <SunMoon className="w-4 h-4" /> Light
                </button>
                <button
                  onClick={() => setPreference('dark')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${mounted && preference==='dark' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                  suppressHydrationWarning
                >
                  <Moon className="w-4 h-4" /> Dark
                </button>
              </div>
            </details>
          </div>
          {user && (
            <button 
              onClick={logout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[15px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
            >
              <LogOut className="w-6 h-6 text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </aside>

      {/* Internal Create Post Modal */}
      <CreatePostModal 
        isOpen={isCreatePostOpen} 
        onClose={() => setIsCreatePostOpen(false)} 
      />
    </>
  );
}

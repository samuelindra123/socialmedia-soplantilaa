"use client";

import Link from "next/link";
import Image from "next/image";
import { Notification } from "@/types";
import { formatRelativeTime } from "@/lib/date/relative-time";
import { MessageSquare, Loader2 } from "lucide-react";

interface NotificationListMessagesProps {
  notifications: Notification[];
  isLoading?: boolean;
}

export function NotificationListMessages({ notifications, isLoading }: NotificationListMessagesProps) {
  if (isLoading && !notifications.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <MessageSquare className="h-6 w-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-900 dark:text-white">Belum ada pesan</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Notifikasi pesan baru akan muncul di sini
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const username = notification.actor?.profile?.username || 'pengguna';
        const href = notification.actionUrl || `/chat/${notification.actor?.id ?? ''}`;
        const avatar = notification.actor?.profile?.profileImageUrl || null;
        const name = notification.actor?.namaLengkap || 'Pengguna';
        const initials = name
          .split(' ')
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join('')
          .toUpperCase();

        return (
          <Link
            key={notification.id}
            href={href}
            className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 transition hover:border-blue-400 dark:hover:border-blue-500"
          >
            {/* Avatar */}
            {avatar ? (
              <Image
                src={avatar}
                alt={name}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-semibold text-white flex-shrink-0">
                {initials}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {name}
                </p>
                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                @{username}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 truncate mt-0.5">
                {notification.message}
              </p>
            </div>

            {/* Unread indicator */}
            {!notification.isRead && (
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

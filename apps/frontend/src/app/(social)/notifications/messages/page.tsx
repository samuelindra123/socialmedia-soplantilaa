"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Link from "next/link";
import { UserPlus, MessageSquare, RefreshCw } from "lucide-react";
import SocialShell from "@/components/layouts/SocialShell";
import { NotificationListMessages } from "@/components/notifications/NotificationListMessages";
import { apiClient } from "@/lib/api/client";
import { Notification, PaginatedResponse } from "@/types";
import { useNotificationStore } from "@/store/notifications";

async function fetchMessageNotifications() {
  const response = await apiClient.get<PaginatedResponse<Notification>>("/notifications/messages", {
    params: { limit: 50 },
  });
  return response.data;
}

async function markNotificationsAsRead(ids: string[]) {
  await Promise.all(
    ids.map((id) => apiClient.put(`/notifications/${id}/read`).catch(() => null)),
  );
}

export default function MessageNotificationsPage() {
  const queryClient = useQueryClient();
  const resetUnreadMessages = useNotificationStore((state) => state.resetUnreadMessages);
  const setUnreadMessageCount = useNotificationStore((state) => state.setUnreadMessageCount);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["message-notifications"],
    queryFn: fetchMessageNotifications,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    resetUnreadMessages();
    setUnreadMessageCount(0);
  }, [resetUnreadMessages, setUnreadMessageCount]);

  useEffect(() => {
    const unread = data?.data?.filter((notification) => !notification.isRead) ?? [];
    if (!unread.length) return;

    markNotificationsAsRead(unread.map((notification) => notification.id))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["message-notifications"] }).catch(() => {});
      })
      .catch(() => {
        toast.error('Gagal memperbarui status notifikasi');
      });
  }, [data, queryClient]);

  useEffect(() => {
    if (!data) return;
    const unread = data.data.filter((notification) => !notification.isRead).length;
    if (unread) {
      setUnreadMessageCount(unread);
    }
  }, [data, setUnreadMessageCount]);

  const notifications = data?.data ?? [];
  const loading = isLoading || isFetching;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["message-notifications"] }).catch(() => {});
  };

  return (
    <SocialShell
      mobileTitle="Notifikasi Pesan"
      mobileDescription="Lihat update pesan terbaru"
      contentClassName="px-0"
    >
      <div className="w-full px-4 py-6 sm:px-6 md:max-w-2xl md:mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifikasi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola permintaan follow dan pesan masuk
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
          <Link
            href="/notifications"
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Permintaan Follow
          </Link>
          <Link
            href="/notifications/messages"
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-slate-900 dark:border-white text-slate-900 dark:text-white -mb-px"
          >
            <MessageSquare className="h-4 w-4" />
            Pesan
          </Link>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-end mb-4 px-1">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Content */}
        <section>
          <NotificationListMessages notifications={notifications} isLoading={loading} />
        </section>
      </div>
    </SocialShell>
  );
}

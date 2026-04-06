"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { RefreshCw, Wifi, WifiOff, UserPlus } from "lucide-react";
import SocialShell from "@/components/layouts/SocialShell";
import { NotificationList } from "@/components/notifications/NotificationList";
import { apiClient } from "@/lib/api/client";
import { FollowRequest, PaginatedResponse } from "@/types";
import { useNotificationsSocket } from "@/providers/notifications-socket-provider";

async function fetchFollowRequests() {
  const response = await apiClient.get<PaginatedResponse<FollowRequest>>("/notifications/follow", {
    params: { limit: 50 },
  });
  return response.data;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { isConnected } = useNotificationsSocket();
  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["follow-requests"],
    queryFn: fetchFollowRequests,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const [actionState, setActionState] = useState<{ id: string; action: 'accept' | 'reject' } | null>(null);

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => apiClient.post("/follow/accept", { followRequestId: requestId }),
    onMutate: (id) => setActionState({ id, action: 'accept' }),
    onSuccess: () => {
      toast.success('Berhasil menerima permintaan follow');
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] }).catch(() => {});
    },
    onError: () => {
      toast.error('Gagal menerima permintaan');
    },
    onSettled: () => setActionState(null),
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => apiClient.post("/follow/reject", { followRequestId: requestId }),
    onMutate: (id) => setActionState({ id, action: 'reject' }),
    onSuccess: () => {
      toast.success('Permintaan follow ditolak');
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] }).catch(() => {});
    },
    onError: () => {
      toast.error('Gagal menolak permintaan');
    },
    onSettled: () => setActionState(null),
  });

  const followRequests = data?.data ?? [];
  const loading = isLoading || isFetching || acceptMutation.isPending || rejectMutation.isPending;
  const lastSyncedLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : 'Belum sinkron';

  const handleAccept = (id: string) => acceptMutation.mutate(id);
  const handleReject = (id: string) => rejectMutation.mutate(id);
  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["follow-requests"] }).catch(() => {});
  };

  return (
    <SocialShell
      mobileTitle="Notifikasi"
      mobileDescription="Kelola permintaan mengikuti"
      disableDefaultContentPadding
      contentClassName="px-0 md:px-6 lg:px-12 pb-8"
    >
      {/* Mobile Layout */}
      <div className="md:hidden w-full px-4 py-6">
        <HeaderBlock />
        <SectionTab />
        <StatusBar
          isConnected={isConnected}
          lastSyncedLabel={lastSyncedLabel}
          isFetching={isFetching}
          onRefresh={handleManualRefresh}
        />
        <NotificationList
          requests={followRequests}
          isLoading={loading}
          processingId={actionState?.id}
          processingAction={actionState?.action ?? null}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex w-full min-h-[calc(100vh-72px)]">
        <div className="flex w-full gap-8">
          <aside className="w-[360px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur px-6 py-6 h-fit">
            <div className="flex flex-col gap-4">
              <HeaderBlock compact />
              <StatusBar
                isConnected={isConnected}
                lastSyncedLabel={lastSyncedLabel}
                isFetching={isFetching}
                onRefresh={handleManualRefresh}
                variant="card"
                label="Segarkan"
              />
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Tips</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Terima hanya permintaan dari akun yang kamu kenal. Gunakan tombol Tolak untuk menjaga privasi.
                </p>
              </div>
            </div>
          </aside>
          <section className="flex-1 rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/70 backdrop-blur px-8 py-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">Pusat Follow</p>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <UserPlus className="h-6 w-6" />
                  Permintaan Follow
                </h2>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isFetching}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Sinkronkan
              </button>
            </div>
            <NotificationList
              requests={followRequests}
              isLoading={loading}
              processingId={actionState?.id}
              processingAction={actionState?.action ?? null}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          </section>
        </div>
      </div>
    </SocialShell>
  );
}

function HeaderBlock({ compact }: { compact?: boolean }) {
  const sizeClass = compact ? "text-xl" : "text-2xl";
  const spacingClass = compact ? "space-y-1" : "mb-6";
  return (
    <header className={spacingClass}>
      <h1 className={`${sizeClass} font-bold text-slate-900 dark:text-white`}>
        Notifikasi
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Kelola permintaan follow yang masuk
      </p>
    </header>
  );
}

function SectionTab() {
  return (
    <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-slate-900 dark:border-white text-slate-900 dark:text-white -mb-px">
        <UserPlus className="h-4 w-4" />
        Permintaan Follow
      </div>
    </div>
  );
}

function StatusBar({
  isConnected,
  lastSyncedLabel,
  isFetching,
  onRefresh,
  variant = "flat",
  label = "Refresh",
}: {
  isConnected: boolean;
  lastSyncedLabel: string;
  isFetching: boolean;
  onRefresh: () => void;
  variant?: "flat" | "card";
  label?: string;
}) {
  const containerClass = variant === "card"
    ? "flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-4"
    : "flex items-center justify-between mb-4 px-1";

  const refreshBtnClass = variant === "card"
    ? "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
    : "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50";

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-3 text-xs">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
          isConnected
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
            : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
        }`}>
          {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isConnected ? 'Realtime' : 'Offline'}
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          Sinkron: <span className="font-medium text-slate-700 dark:text-slate-300">{lastSyncedLabel}</span>
        </span>
      </div>
      <button
        onClick={onRefresh}
        disabled={isFetching}
        className={refreshBtnClass}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        {label}
      </button>
    </div>
  );
}

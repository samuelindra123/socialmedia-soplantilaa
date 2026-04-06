"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ChevronRight, Loader2, UserRoundPlus, X, Check } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { FollowRequest, PaginatedResponse } from "@/types";
import { formatRelativeTime } from "@/lib/date/relative-time";
import useAuthStore from "@/store/auth";

async function fetchPendingFollowRequests() {
  const response = await apiClient.get<PaginatedResponse<FollowRequest>>("/notifications/follow", {
    params: { limit: 3 },
  });
  return response.data;
}

export default function PendingRequestsWidget() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState<{ id: string; action: 'accept' | 'reject' } | null>(null);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["follow-requests", "sidebar"],
    queryFn: fetchPendingFollowRequests,
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const requests = data?.data ?? [];
  const totalPending = data?.meta?.total ?? requests.length;

  const actionMutation = useMutation({
    mutationFn: ({ action, id }: { action: 'accept' | 'reject'; id: string }) => {
      if (action === 'accept') {
        return apiClient.post("/follow/accept", { followRequestId: id });
      }
      return apiClient.post("/follow/reject", { followRequestId: id });
    },
    onMutate: (variables) => {
      setProcessing(variables);
    },
    onSuccess: (_response, variables) => {
      toast.success(variables.action === 'accept' ? 'Permintaan diterima' : 'Permintaan ditolak');
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["follow-requests", "sidebar"] });
    },
    onError: () => {
      toast.error('Gagal memproses permintaan. Coba lagi.');
    },
    onSettled: () => {
      setProcessing(null);
    },
  });

  if (!user || isError) {
    return null;
  }

  const visibleRequests = requests.slice(0, 2);

  const handleAction = (action: 'accept' | 'reject', requestId: string) => {
    if (processing) return;
    actionMutation.mutate({ action, id: requestId });
  };

  const renderAvatar = (request: FollowRequest) => {
    const avatar = request.follower.profileImageUrl;
    const initials = request.follower.namaLengkap
      .split(' ')
      .slice(0, 2)
      .map((segment) => segment.charAt(0))
      .join('')
      .toUpperCase();

    if (avatar) {
      return (
        <Image
          src={avatar}
          alt={request.follower.namaLengkap}
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-cover"
        />
      );
    }

    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white">
        {initials}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-900 dark:text-white">
          Permintaan Follow
        </p>
        <Link
          href="/notifications"
          className="flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          Lihat
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Loading */}
      {(isLoading || isFetching) && !visibleRequests.length && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isFetching && visibleRequests.length === 0 && (
        <div className="text-center py-4">
          <UserRoundPlus className="h-5 w-5 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tidak ada permintaan baru
          </p>
        </div>
      )}

      {/* Request List */}
      {visibleRequests.length > 0 && (
        <div className="space-y-2">
          {visibleRequests.map((request) => {
            const isProcessing = processing?.id === request.id;

            return (
              <div
                key={request.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
              >
                {renderAvatar(request)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                    {request.follower.namaLengkap}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    @{request.follower.username || 'pengguna'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAction('reject', request.id)}
                    disabled={isProcessing}
                    className="flex items-center justify-center h-6 w-6 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="Tolak"
                  >
                    {isProcessing && processing?.action === 'reject' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleAction('accept', request.id)}
                    disabled={isProcessing}
                    className="flex items-center justify-center h-6 w-6 rounded-full text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                    title="Terima"
                  >
                    {isProcessing && processing?.action === 'accept' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show more indicator */}
      {totalPending > 2 && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2">
          +{totalPending - 2} permintaan lainnya
        </p>
      )}
    </div>
  );
}

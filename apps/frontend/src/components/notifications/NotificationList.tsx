"use client";

import Image from "next/image";
import { FollowRequest } from "@/types";
import { formatRelativeTime } from "@/lib/date/relative-time";
import { Check, X, UserRound, Loader2 } from "lucide-react";

interface NotificationListProps {
  requests: FollowRequest[];
  isLoading?: boolean;
  processingId?: string | null;
  processingAction?: 'accept' | 'reject' | null;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export function NotificationList({
  requests,
  isLoading,
  processingId,
  processingAction,
  onAccept,
  onReject,
}: NotificationListProps) {
  if (isLoading && !requests.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <UserRound className="h-6 w-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-900 dark:text-white">Tidak ada permintaan</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Permintaan follow baru akan muncul di sini
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => {
        const avatar = request.follower.profileImageUrl;
        const initials = request.follower.namaLengkap
          .split(' ')
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join('')
          .toUpperCase();
        const meta = formatRelativeTime(request.requestedAt);
        const disabled = processingId === request.id;
        const isAccepting = disabled && processingAction === 'accept';
        const isRejecting = disabled && processingAction === 'reject';

        return (
          <div
            key={request.id}
            className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 transition hover:border-slate-300 dark:hover:border-slate-700"
          >
            {/* Avatar */}
            {avatar ? (
              <Image
                src={avatar}
                alt={request.follower.namaLengkap}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-semibold text-white flex-shrink-0">
                {initials}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {request.follower.namaLengkap}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                @{request.follower.username || 'pengguna'} · {meta}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onReject(request.id)}
                disabled={disabled}
                className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Tolak"
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => onAccept(request.id)}
                disabled={disabled}
                className="flex items-center justify-center h-8 px-4 rounded-full bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAccepting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Terima
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

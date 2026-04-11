"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Check } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import SmartImage from "@/components/ui/SmartImage";
import { useState } from "react";

interface SuggestionUser {
  id: string;
  username: string;
  namaLengkap: string;
  profileImageUrl: string | null;
}

export default function SoplaRightSidebar() {
  const qc = useQueryClient();
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const { data: suggestions = [], isLoading } = useQuery<SuggestionUser[]>({
    queryKey: ["suggestions"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SuggestionUser[] }>("/users/suggestions", {
        params: { limit: 6 },
      });
      return res.data.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => apiClient.post(`/users/${userId}/follow`),
    onSuccess: (_, userId) => {
      setFollowed((prev) => new Set(prev).add(userId));
      qc.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });

  return (
    <aside className="hidden lg:block sticky top-[60px] h-[calc(100vh-60px)] w-72 flex-shrink-0 py-4 px-3 overflow-y-auto">
      {/* Suggestions */}
      <div>
        <div className="flex items-center justify-between px-1 mb-3">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Disarankan
          </h3>
          <Link
            href="/discover"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Lihat semua
          </Link>
        </div>

        <div className="space-y-1">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-white/10 rounded" />
                    <div className="h-2.5 w-16 bg-slate-100 dark:bg-white/[0.06] rounded" />
                  </div>
                </div>
              ))
            : suggestions.map((u) => {
                const isFollowed = followed.has(u.id);
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors group"
                  >
                    <Link
                      href={`/profile/${u.username}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0">
                        {u.profileImageUrl ? (
                          <SmartImage
                            src={u.profileImageUrl}
                            alt={u.namaLengkap}
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white text-xs font-bold">
                            {u.namaLengkap?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {u.namaLengkap}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          @{u.username}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => !isFollowed && followMutation.mutate(u.id)}
                      disabled={isFollowed || followMutation.isPending}
                      className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isFollowed
                          ? "bg-slate-100 dark:bg-white/[0.07] text-slate-500 dark:text-slate-400"
                          : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                      }`}
                    >
                      {isFollowed ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      {isFollowed ? "Diikuti" : "Ikuti"}
                    </button>
                  </div>
                );
              })}
        </div>
      </div>
    </aside>
  );
}

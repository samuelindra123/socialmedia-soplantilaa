"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import useAuthStore from "@/store/auth";
import { apiClient } from "@/lib/api/client";

interface SuggestionUser {
  id: string;
  username: string;
  namaLengkap: string;
  profileImageUrl: string | null;
}

export default function UserSuggestions() {
  const { user, logout } = useAuthStore();

  const {
    data: suggestions = [],
    isLoading: isSuggestionsLoading,
  } = useQuery<SuggestionUser[]>({
    queryKey: ["suggestions"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ data: SuggestionUser[] }>(
          "/users/suggestions",
          { params: { limit: 5 } }
        );
        return res.data.data ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 menit
    retry: false,
  });

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4">
        {/* User Mini Profile */}
        <div className="flex items-center justify-between mb-8">
            <Link href={`/profile/${user?.profile?.username}`} className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  {user?.profile?.profileImageUrl ? (
                    <Image
                      src={user.profile.profileImageUrl}
                      alt={user.profile.username || "Profil"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 font-bold text-sm">
                      {(user?.profile?.username || user?.namaLengkap || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-sm">
                    <p className="font-bold text-slate-900 group-hover:underline">{user?.profile?.username || "username"}</p>
                    <p className="text-slate-500">{user?.namaLengkap}</p>
                </div>
            </Link>
            <button onClick={() => logout()} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                Keluar
            </button>
        </div>

        {/* Suggestions */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-500">Disarankan untuk Anda</h3>
                <Link href="/discover" className="text-xs font-bold text-slate-900 hover:text-slate-600">Lihat Semua</Link>
            </div>
            
            <div className="space-y-4">
                {isSuggestionsLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                                <div className="space-y-1">
                                    <div className="w-20 h-2 bg-slate-100 rounded"></div>
                                    <div className="w-16 h-2 bg-slate-50 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : suggestions && suggestions.length > 0 ? (
                    suggestions.map((suggestion) => (
                        <div key={suggestion.id} className="flex items-center justify-between">
                            <Link href={`/profile/${suggestion.username}`} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                  {suggestion.profileImageUrl ? (
                                    <Image
                                      src={suggestion.profileImageUrl}
                                      alt={suggestion.username}
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 text-xs font-bold">
                                      {suggestion.username?.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 group-hover:underline">{suggestion.username}</p>
                                    <p className="text-[10px] text-slate-500 truncate w-24">{suggestion.namaLengkap}</p>
                                </div>
                            </Link>
                            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Ikuti</button>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-slate-400 text-center py-4">Tidak ada saran saat ini</p>
                )}
            </div>
        </div>

        {/* Footer Links */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-400 mb-4">
            <Link href="#" className="hover:underline">Tentang</Link>
            <Link href="#" className="hover:underline">Bantuan</Link>
            <Link href="#" className="hover:underline">Privasi</Link>
            <Link href="#" className="hover:underline">Syarat</Link>
            <Link href="#" className="hover:underline">Lokasi</Link>
            <Link href="#" className="hover:underline">Bahasa</Link>
        </div>
        <p className="text-[11px] text-slate-400 uppercase">© 2025 RENUNGANKU</p>
    </div>
  );
}

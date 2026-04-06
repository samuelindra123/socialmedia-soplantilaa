"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Search as SearchIcon, Sparkles, Loader2, Users } from "lucide-react";
import SocialShell from "@/components/layouts/SocialShell";
import { apiClient } from "@/lib/api/client";

interface SearchUser {
  username: string;
  namaLengkap: string;
  profileImageUrl: string | null;
}


const useDebounce = <T,>(value: T, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const LAST_METADATA_LABEL = "03 Des 2025, 12.52 WIB";

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword.trim(), 400);
  const enabled = debouncedKeyword.length > 1;

  const { data: searchResponse, isFetching: isSearching } = useQuery({
    queryKey: ["search-users", debouncedKeyword],
    queryFn: async () =>
      (await apiClient.get("/users/search", { params: { q: debouncedKeyword, limit: 12 } })).data as {
        data: SearchUser[];
      },
    enabled,
  });

  const { data: allUsersResponse, isFetching: isAllUsersLoading } = useQuery({
    queryKey: ["search-all-users"],
    queryFn: async () =>
      (await apiClient.get<{ data: SearchUser[] }>("/users/search", { params: { limit: 200 } })).data,
  });

  const searchResults = searchResponse?.data ?? [];
  const allUsers = allUsersResponse?.data ?? [];

  return (
    <SocialShell
      mobileTitle="Cari Pengguna"
      mobileDescription="Temukan kreator dan teman baru"
      contentClassName="px-0 sm:px-4 md:px-6"
    >
      <div className="w-full max-w-6xl mx-auto px-4 lg:px-10 py-8">
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs tracking-[0.5em] uppercase font-semibold text-slate-400 dark:text-slate-500">
                Pusat Pencarian
              </p>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                Cari pengguna & kreator favoritmu
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
                Ketik nama lengkap, username, atau kata kunci lain untuk menemukan profil baru.
                Kami juga menyiapkan rekomendasi akun menarik untukmu.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 w-full md:w-80">
              <SearchIcon className="w-5 h-5 text-slate-500" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari username atau nama..."
                className="bg-transparent flex-1 text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <SearchIcon className="w-4 h-4" />
            <p className="text-sm font-medium">
              {enabled
                ? `Menampilkan ${searchResults.length} hasil pencarian`
                : "Mulai ketik untuk mencari pengguna"}
            </p>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isSearching && (
              <div className="col-span-full flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            )}

            {!isSearching && enabled && searchResults.length === 0 && (
              <div className="col-span-full text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <SearchIcon className="w-10 h-10 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-semibold">Tidak ada hasil</p>
                <p className="text-sm text-slate-500">Coba kata kunci lain atau periksa ejaanmu.</p>
              </div>
            )}

            {(enabled ? searchResults : []).map((user) => (
              <UserCard key={user.username} user={user} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-center gap-2 mb-4 text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em]">
              Rekomendasi untukmu
            </h2>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {allUsers.length} akun · diperbarui {LAST_METADATA_LABEL}
            </span>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isAllUsersLoading && (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            )}
            {!isAllUsersLoading && allUsers.length === 0 && (
              <div className="col-span-full text-center text-slate-500 text-sm">
                Tidak ada rekomendasi saat ini.
              </div>
            )}
            {allUsers.map((user) => (
              <UserCard
                key={user.username}
                user={user}
                variant="glass"
              />
            ))}
          </div>
        </section>
      </div>
    </SocialShell>
  );
}

function UserCard({ user, variant = "solid" }: { user: SearchUser; variant?: "solid" | "glass" }) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className={`group relative overflow-hidden rounded-2xl border transition-transform hover:-translate-y-0.5 ${
        variant === "glass"
          ? "border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      } p-4 shadow-sm hover:shadow-lg`}
    >
      <div className="flex items-center gap-3">
        {user.profileImageUrl ? (
          <Image
            src={user.profileImageUrl}
            alt={user.username}
            width={56}
            height={56}
            className="w-14 h-14 rounded-2xl object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xl font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">{user.namaLengkap}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>Profil</span>
        </div>
        <span className="text-blue-500 font-semibold group-hover:translate-x-0.5 transition-transform">
          Lihat profil →
        </span>
      </div>
    </Link>
  );
}

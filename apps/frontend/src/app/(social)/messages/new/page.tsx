"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Search, Loader2, Check } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import SocialShell from "@/components/layouts/SocialShell";
import { apiClient } from "@/lib/api/client";
import useAuthStore from "@/store/auth";

interface MutualFollow {
  id: string;
  namaLengkap: string;
  username: string | null;
  profileImageUrl: string | null;
}

async function fetchMutualFollows(): Promise<MutualFollow[]> {
  const response = await apiClient.get<MutualFollow[]>("/follow/mutuals");
  return response.data;
}

export default function NewMessagePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<MutualFollow | null>(null);

  const { data: mutualFollows, isLoading } = useQuery({
    queryKey: ["mutual-follows"],
    queryFn: fetchMutualFollows,
    enabled: !!user?.id,
  });

  const createConversationMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await apiClient.get(`/messages/conversation/find/${targetUserId}`);
      return response.data;
    },
    onSuccess: (data) => {
      router.push(`/chat/${data.id}`);
    },
    onError: () => {
      toast.error("Gagal memulai percakapan");
    },
  });

  const filteredUsers = mutualFollows?.filter((u) => {
    if (!searchQuery) return true;
    const name = u.namaLengkap?.toLowerCase() || "";
    const username = u.username?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase());
  });

  const handleSelectUser = (user: MutualFollow) => {
    setSelectedUser(user);
  };

  const handleStartChat = () => {
    if (selectedUser) {
      createConversationMutation.mutate(selectedUser.id);
    }
  };

  return (
    <SocialShell
      mobileTitle="Pesan Baru"
      mobileDescription="Mulai percakapan dengan teman"
      contentClassName="px-0"
    >
      <div className="flex min-h-screen flex-1 w-full flex-col md:border-x md:border-slate-200 md:dark:border-slate-800 md:max-w-2xl md:mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/messages"
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex-1">Pesan Baru</h1>
            {selectedUser && (
              <button
                onClick={handleStartChat}
                disabled={createConversationMutation.isPending}
                className="px-4 py-1.5 bg-blue-500 text-white rounded-full font-semibold text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {createConversationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Chat"
                )}
              </button>
            )}
          </div>

          {/* To field */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Kepada:</span>
            {selectedUser ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full">
                <span className="text-sm font-medium">{selectedUser.namaLengkap}</span>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="hover:text-blue-800 dark:hover:text-blue-300"
                >
                  ×
                </button>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
                autoFocus
              />
            )}
          </div>
        </header>

        {/* User List */}
        <div className="flex-1">
          {!selectedUser && (
            <>
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Saling Mengikuti</p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : !filteredUsers?.length ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <p className="text-slate-500 dark:text-slate-400">
                    {searchQuery
                      ? "Tidak ada pengguna ditemukan"
                      : "Belum ada mutual follow. Follow seseorang dan minta mereka follow balik untuk bisa berkirim pesan."}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left"
                    >
                      {u.profileImageUrl ? (
                        <Image
                          src={u.profileImageUrl}
                          alt={u.namaLengkap}
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                          {u.namaLengkap
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n.charAt(0))
                            .join("")
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {u.namaLengkap}
                        </p>
                        {u.username && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            @{u.username}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {selectedUser && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              {selectedUser.profileImageUrl ? (
                <Image
                  src={selectedUser.profileImageUrl}
                  alt={selectedUser.namaLengkap}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-semibold mb-4">
                  {selectedUser.namaLengkap
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n.charAt(0))
                    .join("")
                    .toUpperCase()}
                </div>
              )}
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedUser.namaLengkap}
              </h2>
              {selectedUser.username && (
                <p className="text-slate-500 dark:text-slate-400">@{selectedUser.username}</p>
              )}
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Klik &quot;Chat&quot; untuk memulai percakapan
              </p>
            </div>
          )}
        </div>
      </div>
    </SocialShell>
  );
}

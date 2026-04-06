"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Search, PenSquare, MessageCircle, Loader2, ShieldCheck, Users, Mail } from "lucide-react";
import SocialShell from "@/components/layouts/SocialShell";
import { apiClient } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/date/relative-time";
import useAuthStore from "@/store/auth";

interface ConversationItem {
  id: string;
  type: string;
  updatedAt: string;
  participant: {
    userId: string;
    namaLengkap: string;
    username: string | null;
    profileImageUrl: string | null;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    senderName: string;
  } | null;
  unreadCount: number;
}

async function fetchConversations(): Promise<ConversationItem[]> {
  const response = await apiClient.get<ConversationItem[]>("/messages/conversations");
  return response.data;
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const filteredConversations = conversations?.filter((conv) => {
    if (!searchQuery) return true;
    const name = conv.participant?.namaLengkap?.toLowerCase() || "";
    const username = conv.participant?.username?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase());
  });

  return (
    <SocialShell
      mobileTitle="Pesan"
      mobileDescription="Kirim dan terima pesan dari teman"
      disableDefaultContentPadding
      contentClassName="px-0 md:px-6 lg:px-12 pb-6"
    >
      {/* Mobile View */}
      <div className="md:hidden flex min-h-screen flex-1 w-full flex-col">
        <header className="sticky top-0 z-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Pesan</h1>
            <Link
              href="/messages/new"
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Pesan Baru"
            >
              <PenSquare className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </Link>
          </div>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pesan"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </header>

        <ConversationList
          isLoading={isLoading}
          conversations={filteredConversations}
          searchQuery={searchQuery}
          currentUserId={user?.id || ""}
          variant="mobile"
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex w-full min-h-[calc(100vh-72px)] gap-6">
        <div className="w-[420px] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur shadow-xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">Kotak Masuk</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pesan</h2>
              </div>
              <Link
                href="/messages/new"
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Pesan Baru"
              >
                <PenSquare className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </Link>
            </div>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari percakapan"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <ConversationList
            isLoading={isLoading}
            conversations={filteredConversations}
            searchQuery={searchQuery}
            currentUserId={user?.id || ""}
            variant="desktop"
          />
        </div>
        <div className="flex-1 rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl p-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-700 dark:text-blue-200 mb-6">
              <ShieldCheck className="h-4 w-4" />
              Mode Desktop Aman
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Pilih percakapan dan lanjutkan obrolan</h3>
            <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Semua pesan yang kamu terima tersusun rapi di sisi kiri. Pilih salah satu percakapan untuk membuka ruang chat berukuran penuh tanpa gangguan visual ala bot AI.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-200" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Percakapan aktif</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">Terhubung</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-200" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Privasi terjaga</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">End-to-end</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                <Mail className="h-6 w-6 text-indigo-600 dark:text-indigo-200" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Notifikasi real-time</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">Aktif</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SocialShell>
  );
}

function ConversationList({
  isLoading,
  conversations,
  searchQuery,
  currentUserId,
  variant,
}: {
  isLoading: boolean;
  conversations?: ConversationItem[];
  searchQuery: string;
  currentUserId: string;
  variant: "mobile" | "desktop";
}) {
  const containerClass = variant === "desktop" ? "flex-1 overflow-y-auto" : "flex-1";
  const paddingClass = variant === "desktop" ? "py-4" : "";

  return (
    <div className={`${containerClass} ${paddingClass}`}>
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : !conversations?.length ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {searchQuery ? "Tidak ada hasil" : "Pesan Kamu"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            {searchQuery
              ? "Coba kata kunci lain"
              : "Kirim pesan ke teman yang saling follow. Pesan akan muncul di sini."}
          </p>
          {!searchQuery && (
            <Link
              href="/messages/new"
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
            >
              Kirim Pesan
            </Link>
          )}
        </div>
      ) : (
        <div className={variant === "desktop" ? "divide-y divide-slate-100 dark:divide-slate-800" : ""}>
          {conversations.map((conv) => (
            <ConversationRow key={conv.id} conversation={conv} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationRow({ conversation, currentUserId }: { conversation: ConversationItem; currentUserId: string }) {
  const participant = conversation.participant;
  const lastMessage = conversation.lastMessage;
  const isUnread = conversation.unreadCount > 0;
  const isFromMe = lastMessage?.senderId === currentUserId;

  const initials = participant?.namaLengkap
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase() || "?";

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
    >
      {/* Avatar */}
      {participant?.profileImageUrl ? (
        <Image
          src={participant.profileImageUrl}
          alt={participant.namaLengkap}
          width={56}
          height={56}
          className="h-14 w-14 rounded-full object-cover"
        />
      ) : (
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold truncate ${isUnread ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
            {participant?.namaLengkap || "Pengguna"}
          </span>
          {participant?.username && (
            <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
              @{participant.username}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {lastMessage ? (
            <>
              <span className={`text-sm truncate ${isUnread ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                {isFromMe ? "Kamu: " : ""}{lastMessage.content}
              </span>
              <span className="text-sm text-slate-400 dark:text-slate-500 flex-shrink-0">
                · {formatRelativeTime(lastMessage.createdAt)}
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Belum ada pesan
            </span>
          )}
        </div>
      </div>

      {/* Unread indicator */}
      {isUnread && (
        <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
      )}
    </Link>
  );
}

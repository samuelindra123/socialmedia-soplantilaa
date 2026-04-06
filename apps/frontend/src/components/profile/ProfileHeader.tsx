"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Settings, UserPlus, UserMinus, MapPin, Link as LinkIcon, Calendar, Clock3, MessageCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import useAuthStore from "@/store/auth";
import { apiClient } from "@/lib/api/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { User } from "@/types";
import { AxiosError } from "axios";

type FollowRelationship = {
  status?: string;
  isFollowing: boolean;
  isPending: boolean;
  isMutual: boolean;
  canMessage: boolean;
};

interface ProfileHeaderProps {
  user: User & { 
    username?: string; 
    bio?: string; 
    websites?: string[]; 
    backgroundProfileUrl?: string;
    memberSince?: string; 
    profileImageUrl?: string; 
    tempatKelahiran?: string 
  };
  isOwnProfile: boolean;
  stats: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
    isFollowing: boolean;
  };
  followStatus?: FollowRelationship;
}

export default function ProfileHeader({ user, isOwnProfile, stats, followStatus }: ProfileHeaderProps) {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [followersCount, setFollowersCount] = useState(stats.followersCount);
  const [relationship, setRelationship] = useState<FollowRelationship>(() => ({
    isFollowing: followStatus?.isFollowing ?? stats.isFollowing ?? false,
    isPending: followStatus?.isPending ?? false,
    isMutual: followStatus?.isMutual ?? false,
    canMessage: followStatus?.canMessage ?? false,
    status: followStatus?.status,
  }));

  useEffect(() => {
    setFollowersCount(stats.followersCount);
  }, [stats.followersCount]);

  useEffect(() => {
    setRelationship({
      isFollowing: followStatus?.isFollowing ?? stats.isFollowing ?? false,
      isPending: followStatus?.isPending ?? false,
      isMutual: followStatus?.isMutual ?? false,
      canMessage: followStatus?.canMessage ?? false,
      status: followStatus?.status,
    });
  }, [followStatus, stats.isFollowing]);

  type FollowAction = 'request' | 'cancel' | 'unfollow';

  const profileUsername = user.profile?.username;
  const targetUsername = useMemo(() => user.username || profileUsername || '', [user.username, profileUsername]);
  const followCacheKey = targetUsername || user.id;

  const followMutation = useMutation({
    mutationFn: async (action: FollowAction) => {
      if (!targetUsername) {
        throw new Error('Username tidak ditemukan');
      }

      if (action === 'request') {
        const { data } = await apiClient.post('/follow/request', { username: targetUsername });
        return data;
      }

      const { data } = await apiClient.delete(`/follow/${targetUsername}`);
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['follow-status', followCacheKey] });
      await queryClient.cancelQueries({ queryKey: ['follow-stats', followCacheKey] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const msg = axiosErr?.response?.data?.message || 'Gagal memproses follow';
      toast.error(msg);
    },
    onSuccess: (_data, action) => {
      if (action === 'request') {
        toast.success('Permintaan follow dikirim');
        setRelationship({
          isFollowing: false,
          isPending: true,
          isMutual: false,
          canMessage: false,
          status: 'PENDING',
        });
      } else if (action === 'unfollow') {
        toast.success('Berhenti mengikuti pengguna');
        setFollowersCount((prev) => Math.max(0, prev - 1));
        setRelationship({
          isFollowing: false,
          isPending: false,
          isMutual: false,
          canMessage: false,
          status: 'NONE',
        });
      } else {
        toast.success('Permintaan follow dibatalkan');
        setRelationship({
          isFollowing: false,
          isPending: false,
          isMutual: false,
          canMessage: false,
          status: 'NONE',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['follow-status', followCacheKey] });
      queryClient.invalidateQueries({ queryKey: ['follow-stats', followCacheKey] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'following'] });
    },
  });

  const handleFollowClick = () => {
    if (!currentUser) {
      toast.error('Masuk terlebih dahulu untuk mengikuti pengguna');
      router.push('/login');
      return;
    }

    if (!targetUsername || followMutation.isPending) return;

    const action: FollowAction = relationship.isPending
      ? 'cancel'
      : relationship.isFollowing
      ? 'unfollow'
      : 'request';

    followMutation.mutate(action);
  };

  const handleMessageClick = () => {
    if (!currentUser) {
      toast.error('Masuk terlebih dahulu untuk mengirim pesan');
      router.push('/login');
      return;
    }

    if (!(relationship.isMutual || relationship.canMessage)) {
      toast.error('Kamu harus mengikuti pengguna ini untuk mengirim pesan.');
      return;
    }

    router.push(`/chat/${user.id}`);
  };

  const canSendMessage = relationship.isMutual || relationship.canMessage;

  return (
    <div className="mb-6">
      {/* Background Cover */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-t-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {user.backgroundProfileUrl && (
          <Image
            src={user.backgroundProfileUrl}
            alt="Profile Background"
            fill
            className="w-full h-full object-cover"
            priority
          />
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-b-2xl border-x border-b border-slate-200 dark:border-slate-700 p-6 md:p-8">
        {/* Profile Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 -mt-20 relative z-10 mb-6">
          {/* Profile Image */}
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 ring-2 ring-slate-200 dark:ring-slate-600 shadow-md">
              <Image
                src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.namaLengkap)}&background=random`}
                alt={user.namaLengkap}
                width={128}
                height={128}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{user.username || user.namaLengkap}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{user.namaLengkap}</p>
              </div>

              <div className="flex items-center gap-2 md:ml-auto">
                {isOwnProfile ? (
                  <a 
                    href="/settings"
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Edit Profil
                  </a>
                ) : (
                  <>
                    <button
                      onClick={handleMessageClick}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                        canSendMessage
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Kirim Pesan
                    </button>
                    <button
                      onClick={handleFollowClick}
                      disabled={followMutation.isPending}
                      className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                        relationship.isFollowing
                          ? 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white'
                          : relationship.isPending
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {followMutation.isPending ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
                          Memproses...
                        </>
                      ) : relationship.isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          Berhenti Mengikuti
                        </>
                      ) : relationship.isPending ? (
                        <>
                          <Clock3 className="w-4 h-4" />
                          Batalkan Permintaan
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Ikuti
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 md:gap-8 mb-6 border-y border-slate-200 dark:border-slate-700 py-4 md:border-none md:py-0">
              <div className="text-center md:text-left">
                <span className="block font-bold text-slate-900 dark:text-white text-lg">{stats.postsCount}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">Postingan</span>
              </div>
              <div className="text-center md:text-left">
                <span className="block font-bold text-slate-900 dark:text-white text-lg">{followersCount}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">Pengikut</span>
              </div>
              <div className="text-center md:text-left">
                <span className="block font-bold text-slate-900 dark:text-white text-lg">{stats.followingCount}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">Mengikuti</span>
              </div>
            </div>

            {/* Bio & Details */}
            <div className="space-y-4">
              {user.bio && (
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{user.bio}</p>
              )}
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                {user.tempatKelahiran && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {user.tempatKelahiran}
                  </div>
                )}
                {user.memberSince && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Bergabung {format(new Date(user.memberSince), "MMMM yyyy", { locale: id })}
                  </div>
                )}
              </div>

              {/* Websites */}
              {user.websites && Array.isArray(user.websites) && user.websites.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Websites</p>
                  <div className="flex flex-wrap gap-2">
                    {user.websites.map((website, idx) => {
                      // Skip if not a string
                      if (!website || typeof website !== 'string') return null;
                      
                      // Clean website URL - remove json string artifacts
                      let cleanedUrl = website.trim();
                      
                      // Handle if stored as JSON string with brackets
                      if (cleanedUrl.startsWith('"') && cleanedUrl.endsWith('"')) {
                        cleanedUrl = cleanedUrl.slice(1, -1);
                      }
                      
                      // Skip empty after cleaning
                      if (!cleanedUrl) return null;
                      
                      // Remove protocol for display
                      const displayUrl = cleanedUrl.replace(/^https?:\/\//, '');
                      
                      // Ensure proper URL
                      const href = cleanedUrl.startsWith('http') ? cleanedUrl : `https://${cleanedUrl}`;
                      
                      return (
                        <a
                          key={idx}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                        >
                          <LinkIcon className="w-3 h-3" />
                          {displayUrl}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

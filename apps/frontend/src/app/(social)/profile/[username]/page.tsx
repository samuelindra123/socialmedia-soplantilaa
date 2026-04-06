"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import SocialThemeWrapper from "@/components/SocialThemeWrapper";
import SocialShell from "@/components/layouts/SocialShell";
import useAuthStore from "@/store/auth";
import { apiClient } from "@/lib/api/client";
import { Loader2, Wifi, WifiOff, RefreshCw, Settings } from "lucide-react";
import { useSocket, useSocketEvent } from "@/providers/SocketProvider";

export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser, isLoading: isAuthLoading } = useAuthStore();
  const { isConnected } = useSocket();
  const [newPostsCount, setNewPostsCount] = useState(0);

  // Fetch user profile data
  const { data: profileData, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${username}`);
      return res.data;
    },
    enabled: !!username,
    retry: 1,
  });

  // Fetch follow stats
  const { data: followStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["follow-stats", username],
    queryFn: async () => {
      const res = await apiClient.get(`/follow/stats/${username}`);
      return res.data;
    },
    enabled: !!username,
  });

  // Check follow status
  const isOwnProfile = currentUser?.profile?.username === username;
  const { data: followStatus } = useQuery({
    queryKey: ["follow-status", username],
    queryFn: async () => {
      const res = await apiClient.get(`/follow/check/${username}`);
      return res.data;
    },
    enabled: !!username && !isOwnProfile && !!currentUser,
  });

  // Fetch user posts
  const { data: userPosts, refetch: refetchPosts } = useQuery({
    queryKey: ["user-posts", profileData?.id],
    queryFn: async () => {
      const res = await apiClient.get(`/posts/feed?userId=${profileData.id}`);
      return res.data.data || []; 
    },
    enabled: !!profileData?.id,
  });

  // Handle new posts
  const handleNewPost = useCallback(
    (post: {
      id: string;
      author?: {
        id?: string;
        username?: string | null;
        profile?: { username?: string | null } | null;
      };
    }) => {
      if (post.author?.profile?.username === username || post.author?.username === username) {
        setNewPostsCount((prev) => prev + 1);
      }
    }, [username]);

  // Handle likes
  const handleLikeUpdate = useCallback(
    (data: { postId: string; likesCount: number; isLiked: boolean }) => {
      queryClient.setQueryData(
        ["user-posts", profileData?.id],
        (oldPosts: Array<{ id: string; _count?: { likes?: number } }> | undefined) => {
          if (!oldPosts) return oldPosts;
          return oldPosts.map((post) =>
            post.id === data.postId
              ? { ...post, _count: { ...(post._count || {}), likes: data.likesCount } }
              : post,
          );
        },
      );
    },
    [queryClient, profileData?.id],
  );

  // Handle delete
  const handlePostDeleted = useCallback(
    (data: { postId: string }) => {
      queryClient.setQueryData(
        ["user-posts", profileData?.id],
        (oldPosts: Array<{ id: string }> | undefined) => {
          if (!oldPosts) return oldPosts;
          return oldPosts.filter((post) => post.id !== data.postId);
        },
      );
    },
    [queryClient, profileData?.id],
  );

  useSocketEvent("new-post", handleNewPost);
  useSocketEvent("like-update", handleLikeUpdate);
  useSocketEvent("post-deleted", handlePostDeleted);

  const loadNewPosts = () => {
    refetchPosts();
    setNewPostsCount(0);
  };

  const profileTitle = profileData?.profile?.username
    ? `@${profileData.profile.username}`
    : profileData?.namaLengkap || "Profil";

  const mobileHeaderRightSlot = isOwnProfile ? (
    <Link
      href="/pengaturan"
      className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
      aria-label="Buka pengaturan akun"
    >
      <Settings className="h-5 w-5" />
    </Link>
  ) : null;

  // LOADING STATE
  if (isAuthLoading || isProfileLoading || isStatsLoading) {
    return (
      <SocialThemeWrapper className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </SocialThemeWrapper>
    );
  }

  // ERROR STATE
  if (profileError) {
    return (
      <SocialShell
        mobileTitle="Profil"
        mobileDescription="Pengguna tidak ditemukan"
        contentClassName="px-4"
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pengguna tidak ditemukan</h2>
            <button 
              onClick={() => router.push("/feed")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </SocialShell>
    );
  }

  return (
    <SocialShell
      mobileTitle={profileTitle}
      mobileDescription={profileData?.profile?.bio || "Profil pengguna"}
      
      // --- PERBAIKAN KRUSIAL DI SINI ---
      // 1. disableDefaultContentPadding: Mematikan padding default SocialShell
      // 2. contentClassName: Kita pakai !p-0 (Important) untuk memaksa padding 0 jika ada CSS lain yg mengganggu
      // 3. !w-full dan !max-w-none: Memastikan container mengambil lebar penuh layar
      disableDefaultContentPadding={true}
      contentClassName="!p-0 !m-0 !w-full !max-w-none flex flex-col"
      mobileHeaderRightSlot={mobileHeaderRightSlot}
    >
      
      {/* LAYOUT LOGIC:
         - Mobile (Default): px-4 py-6 (Ada jarak kiri kanan)
         - Desktop (md:): !p-0 (Padding dinolkan TOTAL agar menempel ke sisi)
      */}
      <div className="w-full flex-1 px-4 py-6 md:!p-0 md:!m-0">
        
        {/* CONTAINER TOMBOL REFRESH / WIFI */}
        {/* Di desktop, kita beri sedikit padding agar ikon tidak menempel sadis ke pojok, 
            tapi header di bawahnya tetap full width */}
        <div className="md:px-6 md:pt-4 mb-4">
            <div className="flex items-center gap-2 mb-2 text-sm">
                {isConnected ? (
                    <span className="flex items-center gap-1 text-green-600">
                    <Wifi className="w-4 h-4" />
                    <span className="sr-only">Online</span>
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-slate-400">
                    <WifiOff className="w-4 h-4" />
                    <span className="sr-only">Offline</span>
                    </span>
                )}
            </div>

            {newPostsCount > 0 && (
                <button
                    onClick={loadNewPosts}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Muat {newPostsCount} postingan baru
                </button>
            )}
        </div>

        {/* PROFILE HEADER & TABS */}
        {/* Wrapper ini memastikan lebar penuh 100% pada desktop */}
        <div className="w-full md:w-full">
            <ProfileHeader 
              user={profileData} 
              isOwnProfile={isOwnProfile}
              stats={{
                followersCount: followStats?.followers || 0,
                followingCount: followStats?.following || 0,
                postsCount: userPosts?.length || 0,
                isFollowing: followStatus?.isFollowing ?? false
              }}
              followStatus={followStatus}
            />
            
            <ProfileTabs posts={userPosts || []} viewerUsername={currentUser?.profile?.username} />
        </div>

      </div>
    </SocialShell>
  );
}
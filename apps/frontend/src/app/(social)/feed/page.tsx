"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "@/store/auth";
import { 
  Loader2,
  RefreshCw,
  Coffee,
  Wifi,
  WifiOff,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Post, PaginatedResponse } from "@/types";
import StoriesRow from "@/components/feed/StoriesRow";
import SocialThemeWrapper from "@/components/SocialThemeWrapper";
import SocialShell from "@/components/layouts/SocialShell";
import UserSuggestions from "@/components/feed/UserSuggestions";
import { useSocket, useSocketEvent } from "@/providers/SocketProvider";
import dynamic from "next/dynamic";

const PostCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700" />
      <div className="space-y-2">
        <div className="w-32 h-3 bg-slate-100 dark:bg-slate-700 rounded" />
        <div className="w-20 h-2 bg-slate-50 dark:bg-slate-600 rounded" />
      </div>
    </div>
    <div className="w-full h-64 bg-slate-50 dark:bg-slate-700 rounded-xl" />
    <div className="space-y-2">
      <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded" />
      <div className="w-3/4 h-3 bg-slate-100 dark:bg-slate-700 rounded" />
    </div>
  </div>
);

const PostCard = dynamic(() => import("@/components/feed/PostCard"), {
  loading: () => <PostCardSkeleton />,
  ssr: false,
});

function LazyPostCard({ post, currentUsername }: { post: Post; currentUsername?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isVisible) return;
    const node = containerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      const timeoutId = window.setTimeout(() => setIsVisible(true), 0);
      return () => window.clearTimeout(timeoutId);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={containerRef} className="min-h-[320px]">
      {isVisible ? (
        <PostCard post={post} context="feed" currentUsername={currentUsername} prefetchComments={isVisible} />
      ) : (
        <PostCardSkeleton />
      )}
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { isConnected } = useSocket();
  const [newPostsCount, setNewPostsCount] = useState(0);

  const isOnboardingDone = !!user?.profile?.isOnboardingComplete;

  useEffect(() => {
    const preload = (PostCard as unknown as { preload?: () => void })?.preload;
    if (typeof window === "undefined" || !preload) return;
    const win = window as typeof window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    if (typeof win.requestIdleCallback === "function") {
      const idleId = win.requestIdleCallback(preload);
      return () => win.cancelIdleCallback?.(idleId);
    }
    const timeoutId = window.setTimeout(preload, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (user && !isOnboardingDone) {
      router.replace('/onboarding');
    }
  }, [user, isOnboardingDone, router]);

  // 1. FETCH FEED DATA
  const { 
    data: feedData, 
    isLoading: isFeedLoading, 
    isError,
    refetch 
  } = useQuery<PaginatedResponse<Post>>({
    queryKey: ['feed', 'following'],
    queryFn: async () => {
      const res = await apiClient.get('/posts/feed?mode=following');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!user && isOnboardingDone,
  });

  // Listen for new posts via Socket.io
  const handleNewPost = useCallback((newPost: Post) => {
    queryClient.setQueryData<PaginatedResponse<Post>>(['feed', 'following'], (old) => {
      if (!old) return old;
      const exists = old.data.some(p => p.id === newPost.id);
      if (exists) return old;
      return {
        ...old,
        data: [newPost, ...old.data],
      };
    });

    if (newPost.author?.id !== user?.id) {
      setNewPostsCount(prev => prev + 1);
    }
  }, [user?.id, queryClient]);

  // Listen for like updates
  const handleLikeUpdate = useCallback((data: { postId: string; likesCount: number; userId: string; liked: boolean }) => {
    console.log('[Socket] Like update received:', data);
    queryClient.setQueryData<PaginatedResponse<Post>>(['feed', 'following'], (old) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map(post => 
          post.id === data.postId 
            ? { 
                ...post, 
                _count: { ...post._count, likes: data.likesCount },
                isLiked: data.userId === user?.id ? data.liked : post.isLiked,
              } 
            : post
        ),
      };
    });
  }, [user?.id, queryClient]);

  // Listen for post deleted
  const handlePostDeleted = useCallback((data: { postId: string }) => {
    queryClient.setQueryData<PaginatedResponse<Post>>(['feed', 'following'], (old) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.filter(post => post.id !== data.postId),
      };
    });
  }, [queryClient]);

  useSocketEvent('new-post', handleNewPost);
  useSocketEvent('like-update', handleLikeUpdate);
  useSocketEvent('post-deleted', handlePostDeleted);

  useEffect(() => {
    if (newPostsCount === 0) return;
    const timeout = window.setTimeout(() => setNewPostsCount(0), 4000);
    return () => window.clearTimeout(timeout);
  }, [newPostsCount]);

  const posts = feedData?.data || [];

  useEffect(() => {
    if (!user || !isOnboardingDone) return;
    const interval = window.setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'following'] });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [user, isOnboardingDone, queryClient]);

  // Loading Auth State
  if (isAuthLoading && !user) {
     return (
        <SocialThemeWrapper className="h-screen flex items-center justify-center bg-white dark:bg-slate-900">
            <Loader2 className="w-8 h-8 text-slate-300 dark:text-slate-600 animate-spin" />
        </SocialThemeWrapper>
     );
  }

  return (
    <SocialShell
      mobileTitle="Beranda"
      mobileDescription="Lihat postingan terbaru dari komunitas"
      contentClassName="px-0 sm:px-4 md:px-6"
    >
      <div className="mx-auto flex w-full max-w-6xl gap-6 lg:gap-8">
        <section className="flex-1 w-full max-w-2xl mx-auto py-8 px-4 sm:px-6">
            
            {/* Realtime Connection Status */}
            <div className="flex items-center justify-end gap-2 mb-4 text-xs text-slate-400 dark:text-slate-500">
              {isConnected ? (
                <span className="flex items-center gap-1 text-green-500 dark:text-green-400">
                  <Wifi className="w-3 h-3" />
                  <span className="sr-only">Online</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                  <WifiOff className="w-3 h-3" />
                  <span className="sr-only">Offline</span>
                </span>
              )}
            </div>
            
            {/* Stories Row Component */}
            <StoriesRow />

            {/* FEED LIST */}
            <div className="space-y-6">
                {/* New Posts Notification */}
                {newPostsCount > 0 && (
                  <div className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {newPostsCount} postingan baru ditambahkan
                  </div>
                )}
                
                {isFeedLoading ? (
                    // Skeleton Loading
                    [1,2,3].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                                <div className="space-y-2">
                                    <div className="w-32 h-3 bg-slate-100 dark:bg-slate-700 rounded"></div>
                                    <div className="w-20 h-2 bg-slate-50 dark:bg-slate-600 rounded"></div>
                                </div>
                            </div>
                            <div className="w-full h-64 bg-slate-50 dark:bg-slate-700 rounded-lg"></div>
                        </div>
                    ))
                ) : isError ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 dark:text-slate-400 mb-4">Gagal memuat feed.</p>
                        <button onClick={() => refetch()} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <RefreshCw className="w-4 h-4 inline mr-2" /> Coba Lagi
                        </button>
                    </div>
                ) : posts && posts.length > 0 ? (
                    // REAL DATA RENDER (hanya tampilkan postingan dengan media)
                    posts
                      .filter((p) => {
                        const type = (p as Post & { type?: string | null }).type ?? undefined;
                        const hasMediaType =
                          type === 'media' || type === 'video' || type === 'image';
                        const hasMediaFiles =
                          (p.images?.length ?? 0) > 0 || (p.videos?.length ?? 0) > 0;
                        return hasMediaType || hasMediaFiles;
                      })
                      .map((post) => (
                        <LazyPostCard
                          key={post.id}
                          post={post}
                          currentUsername={user?.profile?.username}
                        />
                      ))
                ) : (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Coffee className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Feed kosong</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                            Ikuti beberapa akun untuk melihat postingan, atau jelajahi tren terbaru.
                        </p>
                        <div className="mt-6 flex items-center gap-3">
                          <Link href="/discover" className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            Jelajahi
                          </Link>
                        </div>
                    </div>
                )}
            </div>

        </section>

        <aside className="hidden lg:block w-80 py-8">
          <div className="sticky top-6">
            <UserSuggestions />
          </div>
        </aside>
      </div>
    </SocialShell>
  );
}

"use client";

import { useEffect, useState, Suspense, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useInfiniteQuery, useQueryClient, useMutation, InfiniteData } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useSearchParams, usePathname } from "next/navigation";
import SocialShell from "@/components/layouts/SocialShell";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth";
import { PaginatedResponse, Post, PostVideo } from "@/types";
import { Search, Loader2, Heart, MessageSquare, MessageCircle, Filter, Smile, X, Play, Volume2, VolumeX, Pause, Maximize, RefreshCw, ChevronDown, Share2, VolumeX as VolumeMuteIcon, Volume2 as VolumeUnmuteIcon, Compass, User, Home } from "lucide-react";
import SocialThemeWrapper from "@/components/SocialThemeWrapper";

type DiscoverQueryData = InfiniteData<PaginatedResponse<Post>>;
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useSocket, useSocketEvent } from "@/providers/SocketProvider";
import { cn } from "@/lib/utils";

const RAW_ASSET_BASE = (process.env.NEXT_PUBLIC_ASSET_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const QUALITY_ORDER: Array<keyof NonNullable<PostVideo['qualityUrls']>> = ['720p', '480p', '360p', '240p', '144p'];

const buildMediaUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) {
    if (RAW_ASSET_BASE) return `${RAW_ASSET_BASE}${trimmed}`;
    if (typeof window !== 'undefined') return `${window.location.origin}${trimmed}`;
    return trimmed;
  }
  if (trimmed.includes('.') && !trimmed.startsWith('/')) {
    return `https://${trimmed}`;
  }
  if (RAW_ASSET_BASE) return `${RAW_ASSET_BASE}/${trimmed}`;
  if (typeof window !== 'undefined') return `${window.location.origin}/${trimmed}`;
  return trimmed;
};

const ensureValidUrl = (url: string | undefined | null): string => buildMediaUrl(url);

const normalizeVideoUrl = (url: string | null | undefined): string => buildMediaUrl(url);

const resolveVideoUrl = (video?: PostVideo | null): string => {
  if (!video) return '';
  const qualityCandidates = (video.qualityUrls ? QUALITY_ORDER.map((quality) => video.qualityUrls?.[quality]).filter(Boolean) : []) as string[];
  const sources = [video.processedUrl, video.originalUrl, ...qualityCandidates, video.url];
  for (const candidate of sources) {
    const finalUrl = buildMediaUrl(candidate);
    if (finalUrl) return finalUrl;
  }
  return '';
};

const getPostDescription = (html: string | undefined | null, maxLength = 180): string => {
  if (!html) return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
};

// Full description without truncation for modal
const getFullDescription = (html: string | undefined | null): string => {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

function DiscoverContent() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type");
  const { user } = useAuthStore();
  const [q, setQ] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Array<{ id: string; content: string; userId?: string; parentId?: string; user: { id?: string; profile?: { username: string; profileImageUrl?: string | null } }; isLiked?: boolean; _count?: { likes?: number; replies?: number } }>>([]);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isCommentSending, setIsCommentSending] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [showMobileComments, setShowMobileComments] = useState(true);
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Map<string, any[]>>(new Map());
  const [justSentReplyIds, setJustSentReplyIds] = useState<Set<string>>(new Set());
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();
  const { isConnected } = useSocket();
  
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<PaginatedResponse<Post>>({
    queryKey: ["discover", q, typeFilter, user?.id],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", "12");
      params.set("mode", "global");
      if (q.trim()) params.set("q", q.trim());
      if (typeFilter) params.set("type", typeFilter);
      if (user?.id) params.set("currentUserId", user.id);
      const res = await apiClient.get(`/posts/feed?${params.toString()}`);
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    refetchOnWindowFocus: false,
  });

  // Realtime: Listen for new posts
  const handleNewPost = useCallback((newPost: Post) => {
    if (newPost.author?.id !== user?.id) {
      setNewPostsCount(prev => prev + 1);
    }
  }, [user?.id]);

  // Realtime: Listen for like updates
  const handleLikeUpdate = useCallback((data: { postId: string; likesCount: number; userId: string; liked: boolean }) => {
    queryClient.setQueryData(["discover", q, typeFilter, user?.id], (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: PaginatedResponse<Post>) => ({
          ...page,
          data: page.data.map(post => 
            post.id === data.postId 
              ? { ...post, _count: { ...post._count, likes: data.likesCount }, isLiked: data.userId === user?.id ? data.liked : post.isLiked }
              : post
          ),
        })),
      };
    });
    // Update selected post if open
    if (selectedPost?.id === data.postId) {
      setSelectedPost(prev => prev ? { ...prev, _count: { ...prev._count, likes: data.likesCount } } : null);
    }
  }, [queryClient, q, typeFilter, user?.id, selectedPost?.id]);

  // Realtime: Listen for post deleted
  const handlePostDeleted = useCallback((data: { postId: string }) => {
    queryClient.setQueryData(["discover", q, typeFilter, user?.id], (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: PaginatedResponse<Post>) => ({
          ...page,
          data: page.data.filter(post => post.id !== data.postId),
        })),
      };
    });
    if (selectedPost?.id === data.postId) {
      setSelectedPost(null);
      toast.error('Post ini telah dihapus');
    }
  }, [queryClient, q, typeFilter, user?.id, selectedPost?.id]);

  // Realtime: Listen for new comments
  const handleNewComment = useCallback((data: { postId: string; comment: any }) => {
    if (selectedPost?.id === data.postId) {
      setComments(prev => {
        const exists = prev.some(c => c.id === data.comment.id);
        if (exists) return prev;
        
        const newCommentData = { 
          ...data.comment, 
          isLiked: false, 
          _count: { likes: data.comment._count?.likes || 0, replies: data.comment._count?.replies || 0 } 
        };
        
        // If it's a reply, update parent comment's reply count
        // But only if we didn't just send this reply (prevent double increment)
        if (data.comment.parentId && !justSentReplyIds.has(data.comment.id)) {
          return prev.map(c =>
            c.id === data.comment.parentId
              ? { ...c, _count: { ...(c._count || {}), replies: ((c._count?.replies || 0) + 1) } }
              : c
          );
        }
        
        return prev;
      });
      
      // If it's a reply and we already loaded that parent's replies, add it
      if (data.comment.parentId) {
        const parentReplies = repliesMap.get(data.comment.parentId);
        if (parentReplies) {
          const replyExists = parentReplies.some(r => r.id === data.comment.id);
          if (!replyExists) {
            setRepliesMap(prev => {
              const next = new Map(prev);
              next.set(data.comment.parentId, [...(next.get(data.comment.parentId) || []), { ...data.comment, isLiked: false, _count: { likes: data.comment._count?.likes || 0 } }]);
              return next;
            });
          }
        }
      }
      
      // Remove from justSentReplyIds after handling
      if (justSentReplyIds.has(data.comment.id)) {
        setJustSentReplyIds(prev => {
          const next = new Set(prev);
          next.delete(data.comment.id);
          return next;
        });
      }
    }
  }, [selectedPost?.id, repliesMap, justSentReplyIds]);

  // Realtime: Listen for comment like updates
  const handleCommentLikeUpdate = useCallback((data: { postId: string; commentId: string; likesCount: number; userId: string; liked: boolean }) => {
    if (selectedPost?.id === data.postId) {
      setComments(prev => prev.map(c => 
        c.id === data.commentId 
          ? { ...c, _count: { ...(c._count || {}), likes: data.likesCount }, isLiked: data.userId === user?.id ? data.liked : c.isLiked }
          : c
      ));
      
      // Also update in repliesMap if it's a reply
      setRepliesMap(prev => {
        const next = new Map(prev);
        next.forEach((replies, parentId) => {
          const updated = replies.map(r =>
            r.id === data.commentId
              ? { ...r, _count: { ...(r._count || {}), likes: data.likesCount }, isLiked: data.userId === user?.id ? data.liked : r.isLiked }
              : r
          );
          next.set(parentId, updated);
        });
        return next;
      });
    }
  }, [selectedPost?.id, user?.id]);

  // Realtime: Listen for comment deleted
  const handleCommentDeleted = useCallback((data: { postId: string; commentId: string }) => {
    if (selectedPost?.id === data.postId) {
      setComments(prev => {
        const updated = prev.filter(c => c.id !== data.commentId);
        const deletedComment = prev.find(c => c.id === data.commentId);
        if (deletedComment?.parentId) {
          return updated.map(c => 
            c.id === deletedComment.parentId
              ? { ...c, _count: { ...c._count, replies: Math.max(0, (c._count?.replies || 0) - 1) } }
              : c
          );
        }
        return updated;
      });
      setRepliesMap(prev => {
        const next = new Map(prev);
        const parentId = prev.entries().find(([_, replies]) => replies.some(r => r.id === data.commentId))?.[0];
        if (parentId) {
          const updated = (next.get(parentId) || []).filter(r => r.id !== data.commentId);
          if (updated.length === 0) {
            next.delete(parentId);
          } else {
            next.set(parentId, updated);
          }
        }
        return next;
      });
    }
  }, [selectedPost?.id]);

  useSocketEvent('new-post', handleNewPost);
  useSocketEvent('like-update', handleLikeUpdate);
  useSocketEvent('post-deleted', handlePostDeleted);
  useSocketEvent('new-comment', handleNewComment);
  useSocketEvent('comment-like-update', handleCommentLikeUpdate);
  useSocketEvent('comment-deleted', handleCommentDeleted);

  const loadNewPosts = () => {
    refetch();
    setNewPostsCount(0);
  };

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);
  const posts = data?.pages.flatMap((page) => page.data) ?? [];
  const discoverQueryKey = useMemo(() => ["discover", q, typeFilter, user?.id] as const, [q, typeFilter, user?.id]);

  const applyPostUpdate = useCallback((postId: string, updater: (post: Post) => Post) => {
    queryClient.setQueryData<DiscoverQueryData>(discoverQueryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.map((item) => (item.id === postId ? updater(item) : item)),
        })),
      };
    });

    setSelectedPost((prev) => {
      if (!prev || prev.id !== postId) return prev;
      return updater(prev);
    });
  }, [discoverQueryKey, queryClient, setSelectedPost]);

  const likeMutation = useMutation<
    void,
    unknown,
    { postId: string; shouldLike: boolean },
    { previousData?: DiscoverQueryData; prevSelectedPost: Post | null }
  >({
    mutationFn: async ({ postId, shouldLike }) => {
      if (shouldLike) {
        await apiClient.post(`/likes/posts/${postId}`);
      } else {
        await apiClient.delete(`/likes/posts/${postId}`);
      }
    },
    onMutate: async ({ postId, shouldLike }) => {
      const previousData = queryClient.getQueryData<DiscoverQueryData>(discoverQueryKey);
      const prevSelectedPost = selectedPost;
      const countDelta = shouldLike ? 1 : -1;
      applyPostUpdate(postId, (post) => ({
        ...post,
        isLiked: shouldLike,
        _count: {
          ...post._count,
          likes: Math.max(0, (post._count?.likes || 0) + countDelta),
        },
      }));
      return { previousData, prevSelectedPost };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(discoverQueryKey, context.previousData);
      }
      if (context?.prevSelectedPost) {
        setSelectedPost(context.prevSelectedPost);
      }
      const axiosErr = error as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Gagal memproses like');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: discoverQueryKey });
    },
  });

  const togglePostLike = useCallback((post: Post) => {
    if (!user?.id) {
      toast.error('Masuk untuk menyukai postingan');
      return;
    }
    likeMutation.mutate({ postId: post.id, shouldLike: !post.isLiked });
  }, [likeMutation, user?.id]);

  const handleSharePost = useCallback(async (post: Post) => {
    if (typeof window === 'undefined') return;
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/post/${post.id}`;
    const shareTitle = post.title || `Postingan ${post.author?.profile?.username || post.author?.namaLengkap || 'teman'}`;
    const shareText = getPostDescription(post.content, 140) || shareTitle;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        toast.success('Tautan dibagikan');
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Tautan postingan disalin');
        return;
      }

      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        toast.success('Tautan postingan disalin');
      }
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return;
      toast.error('Gagal membagikan postingan');
    }
  }, []);
  const selectedDescription = selectedPost ? getFullDescription(selectedPost.content) : '';
  const getEmptyMessage = () => {
    if (q.trim()) return "Tidak ada hasil untuk pencarian ini.";
    if (typeFilter === "text") return "Belum ada postingan teks.";
    if (typeFilter === "media") return "Belum ada postingan media (gambar/video).";
    return "Belum ada postingan yang sedang tren.";
  };
  
  const getPageTitle = () => {
    if (typeFilter === "text") return "Postingan Teks";
    if (typeFilter === "media") return "Postingan Media";
    return "Jelajahi";
  };
  
  const getPageDescription = () => {
    if (typeFilter === "text") return "Temukan tulisan dan pemikiran menarik";
    if (typeFilter === "media") return "Lihat foto dan video dari komunitas";
    return "Temukan konten menarik dari komunitas";
  };
  const pageTitle = getPageTitle();
  const pageDescription = getPageDescription();
  const mobileHeaderActions = (
    <Link
      href="/feed"
      className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200"
      aria-label="Ke Beranda"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 3l9 9" />
        <path d="M5 10v10h4v-6h6v6h4V10" />
      </svg>
    </Link>
  );
  const handleCloseModal = () => {
    setSelectedPost(null);
    queryClient.invalidateQueries({ queryKey: ["discover"] });
    setShowMobileComments(true);
  };

  // Fetch comments when a post is selected
  useEffect(() => {
    const run = async () => {
      if (!selectedPost) return;
      try {
        const res = await apiClient.get(`/comments/posts/${selectedPost.id}`);
        const list = (res.data?.data || []).map((c: any) => ({
          ...c,
          isLiked: !!c.isLiked,
          _count: { likes: c._count?.likes ?? 0 },
        }));
        setComments(list);
        setShowMobileComments(true);
      } catch {}
    };
    run();
  }, [selectedPost]);


  const sendComment = async () => {
    if (!selectedPost) return;
    const plain = commentText.replace(/<[^>]+>/g, '').trim();
    if (!plain) { toast.error('Komentar tidak boleh kosong'); return; }
    setIsCommentSending(true);
    try {
      await apiClient.post(`/comments/posts/${selectedPost.id}`, { content: commentText });
      setCommentText("");
      const res = await apiClient.get(`/comments/posts/${selectedPost.id}`);
      setComments(res.data?.data || []);
      toast.success('Komentar terkirim');
    } catch (e) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Gagal mengirim komentar');
    } finally { setIsCommentSending(false); }
  };

  const sendReply = async (parentId: string) => {
    if (!selectedPost) return;
    const plain = replyText.replace(/<[^>]+>/g, '').trim();
    if (!plain) { toast.error('Balasan tidak boleh kosong'); return; }
    setIsCommentSending(true);
    try {
      const response = await apiClient.post(`/comments/posts/${selectedPost.id}`, { content: replyText, parentId });
      const newReply = response.data as any;
      
      // Mark this reply as just sent to prevent double increment in socket event
      setJustSentReplyIds(prev => new Set(prev).add(newReply.id));
      
      // Update parent comment's reply count immediately
      setComments(prev =>
        prev.map(c =>
          c.id === parentId
            ? { ...c, _count: { ...c._count, replies: (c._count?.replies || 0) + 1 } }
            : c
        )
      );
      
      // Add reply to repliesMap if parent's replies are already loaded
      setRepliesMap(prev => {
        const next = new Map(prev);
        const parentReplies = next.get(parentId) || [];
        if (parentReplies && parentReplies.length >= 0) {
          next.set(parentId, [...parentReplies, { ...newReply, isLiked: false, _count: { likes: 0 } }]);
        }
        return next;
      });
      
      setReplyText("");
      setReplyFor(null);
      toast.success('Balasan terkirim');
    } catch (e) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Gagal mengirim balasan');
    } finally { setIsCommentSending(false); }
  };

  const fetchReplies = async (commentId: string) => {
    setLoadingReplies(prev => new Set(prev).add(commentId));
    try {
      const res = await apiClient.get(`/comments/${commentId}/replies`);
      setRepliesMap(prev => {
        const next = new Map(prev);
        next.set(commentId, (res.data?.data || []).map((r: any) => ({
          ...r,
          isLiked: !!r.isLiked,
          _count: { likes: r._count?.likes ?? 0 },
        })));
        return next;
      });
    } catch (e) {
      console.error('Error fetching replies:', e);
      toast.error('Gagal memuat balasan');
    } finally {
      setLoadingReplies(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const toggleExpandReplies = (commentId: string) => {
    const isExpanded = expandedReplies.has(commentId);
    if (isExpanded) {
      setExpandedReplies(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    } else {
      setExpandedReplies(prev => new Set(prev).add(commentId));
      if (!repliesMap.has(commentId)) {
        fetchReplies(commentId);
      }
    }
  };

  // Helper to get accurate reply count - use loaded replies if available, otherwise use _count
  const getReplyCount = (commentId: string, countFromDb: number | undefined): number => {
    const loadedReplies = repliesMap.get(commentId);
    if (loadedReplies) {
      return loadedReplies.length;
    }
    return countFromDb || 0;
  };

  const commentLikeMutation = useMutation({
    mutationFn: async ({ commentId, shouldLike }: { commentId: string; shouldLike: boolean }) => {
      if (shouldLike) { await apiClient.post(`/comments/likes/${commentId}`); return { liked: true }; }
      else { await apiClient.delete(`/comments/likes/${commentId}`); return { liked: false }; }
    },
    onMutate: async ({ commentId, shouldLike }) => {
      const prev = comments;
      const prevReplies = repliesMap;
      
      // Check if it's a reply or a main comment
      let isReply = false;
      let parentId = '';
      
      for (const [pId, replies] of repliesMap.entries()) {
        if (replies.some((r: any) => r.id === commentId)) {
          isReply = true;
          parentId = pId;
          break;
        }
      }
      
      if (isReply && parentId) {
        // Update reply in repliesMap
        setRepliesMap(prev => {
          const next = new Map(prev);
          next.set(parentId, 
            (next.get(parentId) || []).map((r: any) =>
              r.id === commentId
                ? {
                    ...r,
                    isLiked: shouldLike,
                    _count: { likes: Math.max(0, (r._count?.likes || 0) + (shouldLike ? 1 : -1)) },
                  }
                : r
            )
          );
          return next;
        });
      } else {
        // Update main comment
        setComments((curr) => curr.map((c) => c.id === commentId ? { ...c, isLiked: shouldLike, _count: { likes: Math.max(0, (c._count?.likes || 0) + (shouldLike ? 1 : -1)) } } : c));
      }
      
      return { prev, prevReplies };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) setComments(ctx.prev);
      if (ctx?.prevReplies) setRepliesMap(ctx.prevReplies);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Gagal memproses like komentar');
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiClient.delete(`/comments/${commentId}`);
      return commentId;
    },
    onMutate: async (commentId) => {
      const prev = comments;
      setComments((curr) => curr.filter((c) => c.id !== commentId));
      return { prev };
    },
    onError: (err, _commentId, ctx) => {
      if (ctx?.prev) setComments(ctx.prev);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Gagal menghapus komentar');
    },
    onSuccess: () => {
      toast.success('Komentar berhasil dihapus');
    },
  });
  return (
    <SocialShell
      mobileTitle={pageTitle}
      mobileDescription={pageDescription}
      contentClassName="px-0 sm:px-4 md:px-6 pb-0 pt-0 md:pb-10 md:pt-4"
      disableDefaultContentPadding
      hideMobileNav
      mobileHeaderRightSlot={mobileHeaderActions}
    >
      <section className="w-full mx-auto md:max-w-[1200px] py-0 md:py-8 px-0 md:px-4 lg:px-12">
        <div className="hidden md:flex md:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {pageTitle}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {pageDescription}
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={typeFilter === "text" ? "Cari tulisan..." : typeFilter === "image" ? "Cari gambar..." : typeFilter === "video" ? "Cari video..." : "Cari di Discover..."}
                className="w-full px-4 py-2.5 pl-10 bg-slate-100 dark:bg-slate-900/40 border border-transparent dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600"
              />
              <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          {/* New Posts Notification */}
          {newPostsCount > 0 && (
            <button
              onClick={loadNewPosts}
              className="hidden md:flex w-full mb-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 animate-pulse"
            >
              <RefreshCw className="w-4 h-4" />
              {newPostsCount} postingan baru tersedia
            </button>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-3">Gagal memuat data.</p>
              <button onClick={() => refetch()} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Coba Lagi</button>
            </div>
          ) : posts.length > 0 ? (
            <>
              <MobileDiscoverFeed
                posts={posts}
                onSelect={setSelectedPost}
                onToggleLike={togglePostLike}
                onShare={handleSharePost}
                likeLoadingPostId={likeMutation.isPending ? likeMutation.variables?.postId ?? null : null}
              />

              <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => {
                const storedType = post.type || 'text';
                const descriptionSnippet = getPostDescription(post.content, 200);
                const primaryVideo = post.videos && post.videos.length > 0 ? post.videos[0] : undefined;
                const video = resolveVideoUrl(primaryVideo || null);
                const image = ensureValidUrl(post.images?.[0]?.url);
                const hasVideo = !!video;
                const hasImage = !!image;
                const isTextOnly = !hasVideo && !hasImage;
                
                if (isTextOnly) {
                  return (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="cursor-pointer group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-md hover:dark:shadow-slate-900/60 transition-all flex flex-col h-full min-h-[200px]"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2">{post.title || "Untitled"}</h3>
                        {descriptionSnippet && (
                          <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-4 leading-relaxed">
                            {descriptionSnippet}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" /> {post._count?.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {post._count?.comments || 0}
                          </span>
                        </div>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                }
                
                // Video or Image post - skip if no valid media URL
                const mediaUrl = hasVideo ? video : image;
                
                // If no valid media URL, treat as text post
                if (!mediaUrl) {
                  return (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="cursor-pointer group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-md hover:dark:shadow-slate-900/60 transition-all flex flex-col h-full min-h-[200px]"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2">{post.title || "Untitled"}</h3>
                        {descriptionSnippet && (
                          <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-4 leading-relaxed">
                            {descriptionSnippet}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post._count?.likes || 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post._count?.comments || 0}</span>
                        </div>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                }
                
                  return (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="relative group overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 aspect-square w-full"
                    >
                      {hasVideo ? (
                        <>
                          <video 
                            src={mediaUrl} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            muted 
                            playsInline
                            preload="metadata"
                          />
                          {/* Video Badge */}
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 z-10">
                            <Play className="w-3 h-3 fill-white" />
                          </div>
                        </>
                      ) : (
                        <Image src={mediaUrl} alt={post.title || "Post image"} width={500} height={500} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
                        <div className="flex items-center gap-6 font-bold">
                          <div className="flex items-center gap-2">
                            <Heart className="w-6 h-6 fill-white" />
                            <span>{post._count?.likes || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 fill-white" />
                            <span>{post._count?.comments || 0}</span>
                          </div>
                        </div>
                        {post.title && <p className="text-sm font-medium mt-2 px-4 text-center line-clamp-1">{post.title}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Tidak ada konten</h3>
              <p className="text-slate-500 dark:text-slate-400">{getEmptyMessage()}</p>
            </div>
          )}
          <div ref={ref} className="flex justify-center py-8">
            {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-slate-400" />}
          </div>
          {selectedPost && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm" onClick={handleCloseModal}>
              <div className="relative bg-white dark:bg-slate-950 dark:text-slate-100 rounded-2xl overflow-hidden w-full max-w-[1100px] max-h-[90vh] flex items-stretch flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in-95 duration-200 mx-auto" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleCloseModal}
                  className="absolute right-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur md:bg-white md:text-slate-700 md:hover:bg-slate-100"
                  aria-label="Tutup modal"
                >
                  <X className="w-5 h-5" />
                </button>
                {/* Left: Media/Text */}
                <DiscoverMediaPanel selectedPost={selectedPost} />

                {/* Right: Comments Panel */}
                <div
                  className={cn(
                    "w-full md:flex-[1] md:min-w-[360px] md:max-w-[420px] bg-white dark:bg-slate-950 flex flex-col flex-shrink-0 overflow-hidden max-h-[90vh]",
                    showMobileComments ? "max-md:flex" : "max-md:hidden"
                  )}
                >
                  {/* Header - Author Info (Instagram Style) */}
                  <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0">
                    <Link href={`/profile/${selectedPost.author.profile?.username || 'user'}`} className="shrink-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 ring-2 ring-pink-100 dark:ring-slate-700">
                        {selectedPost.author.profile?.profileImageUrl ? (
                          <Image src={selectedPost.author.profile.profileImageUrl} alt={selectedPost.author.profile?.username || ''} width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">{(selectedPost.author.profile?.username || 'U').charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${selectedPost.author.profile?.username || 'user'}`} className="font-semibold text-sm text-slate-900 dark:text-white hover:opacity-70">{selectedPost.author.profile?.username || 'user'}</Link>
                    </div>
                    <button
                      type="button"
                      className="md:hidden rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => setShowMobileComments(false)}
                      aria-label="Sembunyikan komentar"
                    >
                      <ChevronDown className="w-4 h-4 text-slate-900 dark:text-white" />
                    </button>
                  </div>

                  {/* Scrollable Content Area - Caption + Comments (Instagram Style) */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Caption Section - Full description */}
                    {(selectedPost.title || selectedDescription || (selectedPost.hashtags && selectedPost.hashtags.length > 0)) && (
                      <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800">
                        {/* Title */}
                        {selectedPost.title && (
                          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">{selectedPost.title}</h3>
                        )}
                        {/* Description - full text */}
                        {selectedDescription && (
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">{selectedDescription}</p>
                        )}
                        
                        {/* Tags */}
                        {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedPost.hashtags.map((t) => (
                              <span key={t} className="text-blue-500 dark:text-blue-400 text-sm hover:opacity-70 cursor-pointer">#{t}</span>
                            ))}
                          </div>
                        )}
                        
                        {/* Time */}
                        <div className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                          {new Date(selectedPost.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    )}

                    {/* Comments List (Instagram Style) */}
                    <div className="p-3 space-y-4">
                      {comments.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-slate-900 dark:text-white font-semibold text-lg mb-1">Belum ada komentar.</p>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Jadilah yang pertama berkomentar.</p>
                        </div>
                      )}
                      
                      {(comments || []).map((c) => {
                        const cUsername = c.user.profile?.username || 'user';
                        const cAvatar = c.user.profile?.profileImageUrl || '';
                        const commentUserId = c.userId || c.user?.id;
                        const isOwnComment = !!(user?.id && commentUserId && user.id === commentUserId);
                        return (
                          <div key={c.id} className="flex gap-3">
                            <Link href={`/profile/${cUsername}`} className="shrink-0">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                                {cAvatar ? (
                                  <Image src={cAvatar} alt={cUsername} width={32} height={32} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">{cUsername.charAt(0).toUpperCase()}</div>
                                )}
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm">
                                <Link href={`/profile/${cUsername}`} className="font-semibold text-slate-900 dark:text-white hover:opacity-70 mr-1">{cUsername}</Link>
                                <span className="text-slate-800 dark:text-slate-200">{c.content}</span>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <button onClick={() => setReplyFor(replyFor === c.id ? null : c.id)} className="font-semibold hover:text-slate-900 dark:hover:text-white">Balas</button>
                                <button
                                  onClick={() => {
                                    if (!user) { toast.error('Harus login untuk menyukai komentar'); return; }
                                    if (commentLikeMutation.isPending) return;
                                    const shouldLike = !(c.isLiked);
                                    commentLikeMutation.mutate({ commentId: c.id, shouldLike });
                                  }}
                                  className="flex items-center gap-1 font-semibold hover:text-slate-900 dark:hover:text-white"
                                >
                                  {(c._count?.likes || 0)} suka
                                </button>
                                <button
                                  onClick={() => toggleExpandReplies(c.id)}
                                  className="font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  {expandedReplies.has(c.id) ? 'Sembunyikan' : 'Lihat'} {getReplyCount(c.id, c._count?.replies)} {getReplyCount(c.id, c._count?.replies) === 1 ? 'balasan' : 'balasan'}
                                </button>
                                {isOwnComment && (
                                  <button
                                    onClick={() => {
                                      if (deleteCommentMutation.isPending) return;
                                      setDeleteCommentId(c.id);
                                    }}
                                    className="text-red-500 hover:text-red-700 font-semibold"
                                  >
                                    Hapus
                                  </button>
                                )}
                              </div>

                              {expandedReplies.has(c.id) && (
                                <div className="mt-3 ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-3">
                                  {loadingReplies.has(c.id) ? (
                                    <div className="text-center text-slate-400 text-xs py-2">Memuat balasan…</div>
                                  ) : (repliesMap.get(c.id) || []).length === 0 ? (
                                    <div className="text-slate-400 text-xs py-2">Tidak ada balasan</div>
                                  ) : (
                                    (repliesMap.get(c.id) || []).map((reply) => {
                                      const rUsername = reply.user.profile?.username || 'user';
                                      const rAvatar = reply.user.profile?.profileImageUrl || '';
                                      const replyUserId = reply.userId || reply.user?.id;
                                      const isOwnReply = !!(user?.id && replyUserId && user.id === replyUserId);
                                      return (
                                        <div key={reply.id} className="flex gap-2">
                                          <Link href={`/profile/${rUsername}`} className="shrink-0">
                                            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100">
                                              {rAvatar ? (
                                                <img src={rAvatar} alt={rUsername} className="w-full h-full object-cover" />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white text-[10px] font-bold">{rUsername.charAt(0).toUpperCase()}</div>
                                              )}
                                            </div>
                                          </Link>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs">
                                              <Link href={`/profile/${rUsername}`} className="font-semibold text-slate-900 dark:text-white hover:opacity-70 mr-1">{rUsername}</Link>
                                              <span className="text-slate-800 dark:text-slate-200">{reply.content}</span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                                              <button
                                                onClick={() => {
                                                  if (!user) { toast.error('Harus login'); return; }
                                                  if (commentLikeMutation.isPending) return;
                                                  const shouldLike = !reply.isLiked;
                                                  commentLikeMutation.mutate({ commentId: reply.id, shouldLike });
                                                }}
                                                className="flex items-center gap-1 font-semibold hover:text-slate-900 dark:hover:text-white"
                                              >
                                                {(reply._count?.likes || 0)} suka
                                              </button>
                                              {isOwnReply && (
                                                <button
                                                  onClick={() => {
                                                    if (deleteCommentMutation.isPending) return;
                                                    setDeleteCommentId(reply.id);
                                                  }}
                                                  className="text-red-500 hover:text-red-700 font-semibold"
                                                >
                                                  Hapus
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => {
                                              if (!user) { toast.error('Harus login'); return; }
                                              if (commentLikeMutation.isPending) return;
                                              commentLikeMutation.mutate({ commentId: reply.id, shouldLike: !reply.isLiked });
                                            }}
                                            className="shrink-0 pt-1"
                                          >
                                            <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-slate-600'}`} />
                                          </button>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}

                              {replyFor === c.id && (
                                <div className="relative mt-2">
                                  <textarea value={replyText} onChange={(e)=>setReplyText(e.target.value)} placeholder={`Balas @${cUsername}...`} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-16 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-slate-100 placeholder:text-slate-400 resize-none" rows={1} />
                                  <button onClick={()=>sendReply(c.id)} disabled={isCommentSending} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 text-sm font-semibold hover:text-blue-600 disabled:opacity-50">{isCommentSending ? '...' : 'Kirim'}</button>
                                </div>
                              )}
                            </div>
                            {/* Like icon on right */}
                            <button
                              onClick={() => {
                                if (!user) { toast.error('Harus login'); return; }
                                if (commentLikeMutation.isPending) return;
                                commentLikeMutation.mutate({ commentId: c.id, shouldLike: !c.isLiked });
                              }}
                              className="shrink-0 pt-1"
                            >
                              <Heart className={`w-3 h-3 ${c.isLiked ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-slate-600'}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment Form - Fixed at Bottom (Instagram Style) */}
                  <div className="border-t border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950 shrink-0">
                    <div className="flex items-center gap-3">
                      <Smile className="w-6 h-6 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0" />
                      <input 
                        value={commentText} 
                        onChange={(e)=>setCommentText(e.target.value)} 
                        placeholder="Tambahkan komentar..." 
                        className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100 placeholder:text-slate-400"
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                      />
                      <button 
                        onClick={sendComment} 
                        disabled={isCommentSending || !commentText.trim()} 
                        className="text-blue-500 text-sm font-semibold hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        {isCommentSending ? 'Mengirim...' : 'Kirim'}
                      </button>
                    </div>
                  </div>
                </div>

                {!showMobileComments && (
                  <button
                    type="button"
                    onClick={() => setShowMobileComments(true)}
                    className="md:hidden absolute bottom-4 right-4 z-40 rounded-full bg-black/70 p-3 text-white shadow-lg"
                    aria-label="Buka komentar"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Delete Comment Confirmation Modal - Using Portal */}
          <DeleteCommentModal 
            isOpen={!!deleteCommentId}
            onClose={() => setDeleteCommentId(null)}
            onConfirm={() => {
              if (deleteCommentId) {
                deleteCommentMutation.mutate(deleteCommentId);
                setDeleteCommentId(null);
              }
            }}
            isPending={deleteCommentMutation.isPending}
          />
      </section>
      <DiscoverMobileNav
        isVisible={isMobileNavVisible}
        onToggle={() => setIsMobileNavVisible((prev) => !prev)}
      />
    </SocialShell>
  );
}

// Delete Comment Modal with Portal
function DeleteCommentModal({ isOpen, onClose, onConfirm, isPending }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isPending: boolean }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-950 dark:text-slate-100 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hapus Komentar?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Komentar yang dihapus tidak dapat dikembalikan.</p>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <button 
            onClick={onConfirm} 
            disabled={isPending} 
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Menghapus...' : 'Hapus'}
          </button>
          <button onClick={onClose} className="w-full py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-sm font-medium transition-colors">Batal</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Separate component for modal media panel with video controls
function DiscoverMediaPanel({ selectedPost }: { selectedPost: Post }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check what media actually exists
  const primaryVideo = selectedPost.videos && selectedPost.videos.length > 0 ? selectedPost.videos[0] : undefined;
  const videoUrl = resolveVideoUrl(primaryVideo || null) || null;
  const imageUrl = ensureValidUrl(selectedPost.images?.[0]?.url) || null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoProgress(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setVideoProgress(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Auto-play video when modal opens
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [videoUrl]);

  if (videoUrl) {
    return (
      <div 
        className="relative flex w-full md:flex-[2] min-w-0 items-center justify-center bg-black cursor-pointer group rounded-t-2xl md:rounded-none overflow-hidden max-h-[calc(100vh-8rem)] md:max-h-[90vh]"
        onClick={togglePlay}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="h-full w-full object-contain"
          loop
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Center Play/Pause Button */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all hover:scale-110"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white" fill="white" />
            ) : (
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            )}
          </button>
        </div>

        {/* Bottom Controls */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-12 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Progress Bar */}
          <div className="flex items-center gap-3 mb-3">
            <input
              type="range"
              min={0}
              max={videoDuration || 100}
              value={videoProgress}
              onChange={handleSeek}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>
          
          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="text-white hover:text-white/80 transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button 
                onClick={toggleMute}
                className="text-white hover:text-white/80 transition-colors"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <span className="text-white text-sm font-medium">
                {formatTime(videoProgress)} / {formatTime(videoDuration)}
              </span>
            </div>
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-white/80 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="flex w-full md:flex-[2] min-w-0 items-center justify-center bg-black rounded-t-2xl md:rounded-none overflow-hidden max-h-[calc(100vh-8rem)] md:max-h-[90vh]">
        <Image src={imageUrl} alt="" width={1080} height={1080} className="h-full w-full object-contain" />
      </div>
    );
  }

  // Text-only post
  return (
    <div className="flex w-full md:flex-[2] min-w-0 items-start bg-slate-50 dark:bg-slate-900 p-4 md:p-8 overflow-y-auto rounded-t-2xl md:rounded-none max-h-[calc(100vh-8rem)] md:max-h-[90vh]">
      <div className="w-full min-h-min">
        {selectedPost.title && (<h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">{selectedPost.title}</h2>)}
        <div className="prose prose-slate dark:prose-invert prose-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-w-none pb-6 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
      </div>
    </div>
  );
}

function MobileDiscoverFeed({
  posts,
  onSelect,
  onToggleLike,
  onShare,
  likeLoadingPostId,
}: {
  posts: Post[];
  onSelect: (post: Post) => void;
  onToggleLike: (post: Post) => void;
  onShare: (post: Post) => void | Promise<void>;
  likeLoadingPostId: string | null;
}) {
  if (!posts.length) return null;
  return (
    <div className="md:hidden w-screen">
      <div className="h-[calc(100vh-56px)] snap-y snap-mandatory overflow-y-scroll touch-pan-y">
        {posts.map((post) => (
          <MobileReelCard
            key={post.id}
            post={post}
            onSelect={() => onSelect(post)}
            onToggleLike={() => onToggleLike(post)}
            onShare={() => onShare(post)}
            isLikeLoading={likeLoadingPostId === post.id}
          />
        ))}
      </div>
    </div>
  );
}

function MobileReelCard({
  post,
  onSelect,
  onToggleLike,
  onShare,
  isLikeLoading,
}: {
  post: Post;
  onSelect: () => void;
  onToggleLike: () => void;
  onShare: () => void | Promise<void>;
  isLikeLoading: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { ref, inView } = useInView({ threshold: 0.8 });
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const videoUrl = resolveVideoUrl(post.videos && post.videos.length > 0 ? post.videos[0] : null);
  const imageUrl = ensureValidUrl(post.images?.[0]?.url);
  const descriptionSnippet = getPostDescription(post.content, 200);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoUrl) return;
    if (inView) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [inView, videoUrl]);

  return (
    <article
      ref={ref}
      onClick={onSelect}
      className="snap-start relative h-[calc(100vh-56px)] w-screen overflow-hidden bg-black text-white"
    >
      {videoUrl && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted((prev) => {
              const next = !prev;
              if (videoRef.current) {
                videoRef.current.muted = next;
                if (!hasInteracted) {
                  videoRef.current.play().catch(() => {});
                  setHasInteracted(true);
                }
              }
              return next;
            });
          }}
          className="absolute top-4 right-4 z-30 rounded-full bg-black/60 p-3 backdrop-blur text-white"
          aria-label={isMuted ? "Aktifkan suara" : "Matikan suara"}
        >
          {isMuted ? <VolumeMuteIcon className="h-6 w-6" /> : <VolumeUnmuteIcon className="h-6 w-6" />}
        </button>
      )}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="h-full w-full object-cover"
          loop
          playsInline
          muted={isMuted}
          preload="metadata"
        />
      ) : imageUrl ? (
        <Image
          src={imageUrl}
          alt={post.title || "Discover image"}
          fill
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-6 text-center">
          <p className="text-lg font-semibold leading-relaxed">
            {descriptionSnippet || post.title || "Konten teks"}
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black/80 to-transparent" />

      <div className="absolute top-5 left-5 right-5 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/40">
            {post.author.profile?.profileImageUrl ? (
              <Image
                src={ensureValidUrl(post.author.profile.profileImageUrl)}
                alt={post.author.profile?.username || "user"}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/20 text-lg font-bold">
                {(post.author.profile?.username || post.author.namaLengkap || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{post.author.profile?.username || post.author.namaLengkap}</p>
            <p className="text-xs text-white/70">{new Date(post.createdAt).toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-28 left-5 right-24 z-10">
        {post.title && <h3 className="text-2xl font-bold mb-2">{post.title}</h3>}
        {descriptionSnippet && (
          <p className="text-sm text-white/80 line-clamp-4 mb-3">{descriptionSnippet}</p>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-blue-300">
            {post.hashtags.slice(0, 4).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-24 right-4 z-20 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike();
          }}
          disabled={isLikeLoading}
          aria-pressed={!!post.isLiked}
          className={cn(
            "flex flex-col items-center gap-1 text-sm transition-opacity",
            isLikeLoading && "opacity-60"
          )}
        >
          <Heart
            className={cn(
              "h-7 w-7",
              post.isLiked && "fill-current text-red-500 stroke-red-500"
            )}
          />
          <span>{post._count?.likes || 0}</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="flex flex-col items-center gap-1 text-sm"
        >
          <MessageSquare className="h-7 w-7" />
          <span>{post._count?.comments || 0}</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="flex flex-col items-center gap-1 text-sm"
        >
          <Share2 className="h-7 w-7" />
          <span>Bagikan</span>
        </button>
      </div>
    </article>
  );
}

function DiscoverMobileNav({ isVisible, onToggle }: { isVisible: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const profileHref = user?.profile?.username
    ? `/profile/${user.profile.username}`
    : user?.id
      ? `/profile/${user.id}`
      : "/profile";

  const navItems = [
    { icon: Home, label: "Beranda", href: "/feed" },
    { icon: Compass, label: "Discover", href: "/discover" },
    { icon: Search, label: "Cari", href: "/search" },
    { icon: MessageCircle, label: "Pesan", href: "/messages" },
    { icon: User, label: "Profil", href: profileHref },
  ];

  return (
    <div className="md:hidden pointer-events-none fixed inset-x-0 bottom-2 z-50 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white shadow-lg"
      >
        <ChevronDown className={cn("h-4 w-4 transition-transform", isVisible ? "rotate-0" : "rotate-180")}
        />
        {isVisible ? "Sembunyikan" : "Tampilkan"}
      </button>
      <nav
        className={cn(
          "pointer-events-auto w-[92%] max-w-md rounded-3xl border border-slate-200/80 bg-white/95 dark:bg-slate-950/95 shadow-2xl backdrop-blur px-6 py-3 transition-all duration-300",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}
        aria-label="Navigasi Discover"
      >
        <div className="flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 text-[11px] font-medium text-slate-500",
                  isActive && "text-blue-600"
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full transition-all",
                    isActive ? "bg-blue-50" : "bg-transparent"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <SocialThemeWrapper className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-slate-900 dark:text-white animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Memuat Discover...</p>
          </div>
        </SocialThemeWrapper>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}

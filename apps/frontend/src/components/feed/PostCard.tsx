"use client";

import { useState, useEffect, ReactNode, useCallback, CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import useAuthStore from "@/store/auth";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/utils";
import { Post, PaginatedResponse, PostVideo } from "@/types";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, X, Smile, Tag, Play, Pause, Volume2, VolumeX, Check, Copy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { useSocketEvent } from "@/providers/SocketProvider";
import { FeedVideoPlayer } from "@/components/FeedVideoPlayer";
import ModalVideoMirror from "@/components/ModalVideoMirror";
import { useVideoPlaybackStore, useActiveVideo, useVideoControls } from "@/store/videoPlaybackV2";

/**
 * Normalize video URLs to ensure they have proper protocol
 */
const normalizeVideoUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Already has protocol
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Has protocol-relative path
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // Has domain but missing protocol (e.g., "sgp1.digitaloceanspaces.com/...")
  if (trimmed.includes('.') && !trimmed.startsWith('/')) {
    return `https://${trimmed}`;
  }

  // Relative path - not valid for video
  return '';
};

const COMMON_EMOJIS = [
  "😀", "😂", "😍", "😎", "🥳", "🤩", "😢", "😡", "🙏", "👏", "🔥", "❤️", "🤔", "👍", "🎉", "🙌"
];

const RichTextEditor = dynamic(() => import("@/components/common/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl min-h-[120px] animate-pulse" />
  ),
});

interface PostCardProps {
  post: Post;
  context?: 'feed' | 'explore' | 'profile';
  currentUsername?: string;
  prefetchComments?: boolean;
}

type LikeItem = {
  id?: string;
  username?: string;
  profileImageUrl?: string | null;
  user?: {
    id: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
};

type CommentItem = {
  id: string;
  content: string;
  userId?: string;
  user: { id?: string; profile?: { username: string; profileImageUrl: string | null } };
  isLiked?: boolean;
  _count?: { likes?: number; replies?: number };
  createdAt?: string;
  parentId?: string | null;
};

function Modal({ open, onClose, children, contentClassName, keepMounted = false }: { open: boolean; onClose: () => void; children: ReactNode; contentClassName?: string; keepMounted?: boolean }) {
  const shouldRender = open || keepMounted;
  if (!shouldRender) return null;
  return (
    <div
      className={clsx(
        "fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-200",
        open ? "bg-slate-900/65 backdrop-blur-sm opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      onClick={open ? onClose : undefined}
      aria-hidden={!open}
    >
      <div
        className={clsx(
          "bg-white dark:bg-slate-800 rounded-xl w-full shadow-2xl transition-transform duration-200",
          open ? "scale-100" : "scale-95",
          contentClassName
        )}
        onClick={(e) => e.stopPropagation()}
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}

// Portal Modal - renders directly to document.body to avoid z-index/overflow issues
function PortalModal({ open, onClose, children, contentClassName }: { open: boolean; onClose: () => void; children: ReactNode; contentClassName?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={clsx("bg-white dark:bg-slate-800 rounded-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200", contentClassName)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// Follow Button Component
function FollowButton({ targetUsername, initialIsFollowing }: { targetUsername: string; initialIsFollowing: boolean }) {
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const { user } = useAuthStore();

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const followStatusQuery = useQuery({
    queryKey: ["follow-status", targetUsername],
    queryFn: async () => {
      const { data } = await apiClient.get(`/follow/check/${targetUsername}`);
      return data as { isFollowing: boolean };
    },
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (typeof followStatusQuery.data?.isFollowing === "boolean") {
      setIsFollowing(followStatusQuery.data.isFollowing);
    }
  }, [followStatusQuery.data]);

  const followMutation = useMutation({
    mutationFn: async ({ action }: { action: 'follow' | 'unfollow' }) => {
      if (action === 'unfollow') {
        const { data } = await apiClient.delete(`/follow/${targetUsername}`);
        return { isFollowing: false, ...data };
      } else {
        const { data } = await apiClient.post(`/follow/${targetUsername}`);
        return { isFollowing: true, ...data };
      }
    },
    onMutate: async ({ action }) => {
      await queryClient.cancelQueries({ queryKey: ["follow-status", targetUsername] });
      const prevStatus = queryClient.getQueryData<{ isFollowing: boolean }>(["follow-status", targetUsername]);
      const newStatus = action === 'follow';
      queryClient.setQueryData(["follow-status", targetUsername], { isFollowing: newStatus });
      setIsFollowing(newStatus);
      return { prevStatus };
    },
    onError: (err: unknown, _vars, ctx) => {
      if (ctx?.prevStatus !== undefined) {
        queryClient.setQueryData(["follow-status", targetUsername], ctx.prevStatus);
        if (typeof ctx.prevStatus?.isFollowing === 'boolean') setIsFollowing(ctx.prevStatus.isFollowing);
      } else {
        setIsFollowing((prev) => !prev);
      }
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Gagal memproses follow';
      toast.error(msg);
    },
    onSuccess: (data: { isFollowing?: boolean }) => {
      if (typeof data?.isFollowing === 'boolean') {
        setIsFollowing(data.isFollowing);
      }
      queryClient.invalidateQueries({ queryKey: ["follow-status", targetUsername] });
      queryClient.invalidateQueries({ queryKey: ["discover"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["feed"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["explore"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["profile", targetUsername] });
    },
  });

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (followMutation.isPending) return;
    const action: 'follow' | 'unfollow' = isFollowing ? 'unfollow' : 'follow';
    followMutation.mutate({ action });
  };

  return (
    <button
      onClick={handleFollowClick}
      disabled={followMutation.isPending}
      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${isFollowing
        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
        : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
    >
      {followMutation.isPending ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}

// Helper function to ensure URL has proper protocol
function ensureValidUrl(url: string | undefined): string | undefined {
  if (!url || url.trim() === '') return undefined;
  // If URL doesn't start with http:// or https://, add https://
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.includes('.') && !url.startsWith('/')) return `https://${url}`;
  return undefined;
}

const getFiniteNumber = (value: number | undefined | null): number => {
  if (typeof value !== 'number') return 0;
  return Number.isFinite(value) ? value : 0;
};

// Format video time (seconds -> mm:ss)
const formatVideoTime = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
export default function PostCard({ post, context = 'feed', currentUsername, prefetchComments = false }: PostCardProps) {
  const username = post.author.profile?.username || "unknown";
  const avatar = post.author.profile?.profileImageUrl;

  // Check what media actually exists in the post
  const hasVideos = post.videos && post.videos.length > 0 && post.videos[0]?.url;
  const hasImages = post.images && post.images.length > 0 && post.images[0]?.url;

  // Determine what to show: prioritize video over image
  // For new posts: type='video' shows video, type='image' shows image, type='text' shows nothing
  // For old posts: show whatever media exists
  const storedType = post.type || 'text';

  let rawPostImage: string | undefined;
  let rawPostImageThumbnail: string | undefined;
  let videoData: PostVideo | undefined;

  if (storedType === 'video' && hasVideos && post.videos && post.videos[0]) {
    // Video post - use instant preview system
    videoData = post.videos[0];
  } else if (storedType === 'image' && hasImages && post.images && post.images[0]) {
    // Image post - show image only
    rawPostImage = post.images[0].url;
    rawPostImageThumbnail = post.images[0].thumbnailUrl || post.images[0].url;
  } else if (storedType === 'media' || storedType === 'text') {
    // Old format or text with media - show what exists (video takes priority)
    if (hasVideos && post.videos && post.videos[0]) {
      videoData = post.videos[0];
    } else if (hasImages && post.images && post.images[0]) {
      rawPostImage = post.images[0].url;
      rawPostImageThumbnail = post.images[0].thumbnailUrl || post.images[0].url;
    }
  }

  // Ensure URLs have proper protocol
  const postImage = ensureValidUrl(rawPostImage);
  const postImageThumbnail = ensureValidUrl(rawPostImageThumbnail) || postImage;
  const postVideo = videoData ? ensureValidUrl(videoData.originalUrl || videoData.processedUrl || videoData.url) : undefined;

  const isOwner = currentUsername && currentUsername === username;
  const hasMedia = !!postVideo || !!postImage;

  // State
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Edit State
  const [editContent, setEditContent] = useState(post.content);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editTags, setEditTags] = useState<string[]>(post.hashtags || []);
  const [currentEditTag, setCurrentEditTag] = useState("");

  const [updatedContent, setUpdatedContent] = useState<string | null>(null);
  const [updatedTitle, setUpdatedTitle] = useState<string | null>(null);
  const [updatedTags, setUpdatedTags] = useState<string[] | null>(null);

  // Video State - using Zustand v2 store (single video element architecture)
  const {
    activePostId,
    isPlaying,
    isMuted,
    progress: videoProgress,
    duration: videoDuration,
    showControls,
    currentTime: videoCurrentTime,
    isModalOpen,
  } = useActiveVideo();

  const {
    togglePlayPause,
    toggleMute,
    seekPercent,
    showControlsTemporarily,
    openModal: openVideoModal,
    closeModal: closeVideoModal,
  } = useVideoControls();

  // Check if this post's video is currently active
  const isThisVideoActive = activePostId === post.id;

  // Derived state
  const contentToDisplay = updatedContent ?? post.content;
  const titleToDisplay = updatedTitle ?? post.title;
  const tagsToDisplay = updatedTags ?? post.hashtags;

  // State for expandable description
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const MAX_DESCRIPTION_LENGTH = 150; // Characters before truncating
  const shouldTruncate = contentToDisplay && contentToDisplay.replace(/<[^>]+>/g, '').length > MAX_DESCRIPTION_LENGTH;

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Like state
  const [isLiked, setIsLiked] = useState(!!post.isLiked);
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
  const [likeBurst, setLikeBurst] = useState(false);

  // Sync like state from props (for realtime updates from socket)
  useEffect(() => {
    setIsLiked(!!post.isLiked);
  }, [post.isLiked]);

  useEffect(() => {
    setLikesCount(post._count?.likes || 0);
  }, [post._count?.likes]);

  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommentSending, setIsCommentSending] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [detectedMediaAspectRatio, setDetectedMediaAspectRatio] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [isCommentPanelPrepared, setIsCommentPanelPrepared] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Map<string, CommentItem[]>>(new Map());
  const [justSentReplyIds, setJustSentReplyIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!commentPanelOpen) return;
    const updateViewport = () => {
      if (typeof window === 'undefined') return;
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [commentPanelOpen]);

  const prepareCommentPanel = useCallback(() => {
    if (!isCommentPanelPrepared) {
      setIsCommentPanelPrepared(true);
    }
  }, [isCommentPanelPrepared]);

  // Helper to get accurate reply count - use loaded replies if available, otherwise use _count
  const getReplyCount = (commentId: string, countFromDb: number | undefined): number => {
    const loadedReplies = repliesMap.get(commentId);
    if (loadedReplies) {
      return loadedReplies.length;
    }
    return countFromDb || 0;
  };

  // Socket event handlers for realtime comments
  const handleNewComment = useCallback((data: { postId: string; comment: CommentItem }) => {
    if (data.postId === post.id && commentPanelOpen) {
      // Only add if not already in list (prevent duplicates from own comments)
      setComments(prev => {
        const exists = prev.some(c => c.id === data.comment.id);
        if (exists) return prev;

        // If it's a reply, update parent comment's reply count
        // But only if we didn't just send this reply (prevent double increment)
        if (data.comment.parentId && !justSentReplyIds.has(data.comment.id)) {
          return prev.map(c =>
            c.id === data.comment.parentId
              ? { ...c, _count: { ...c._count, replies: (c._count?.replies || 0) + 1 } }
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
              next.set(data.comment.parentId!, [...(next.get(data.comment.parentId!) || []), { ...data.comment, isLiked: false, _count: { likes: 0 } }]);
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
  }, [post.id, commentPanelOpen, repliesMap, justSentReplyIds]);

  const handleCommentLikeUpdate = useCallback((data: { postId: string; commentId: string; likesCount: number; userId: string; liked: boolean }) => {
    if (data.postId === post.id) {
      setComments(prev => prev.map(c =>
        c.id === data.commentId
          ? { ...c, _count: { ...c._count, likes: data.likesCount }, isLiked: data.userId === user?.id ? data.liked : c.isLiked }
          : c
      ));
    }
  }, [post.id, user?.id]);

  const handleCommentDeleted = useCallback((data: { postId: string; commentId: string }) => {
    if (data.postId === post.id) {
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
  }, [post.id]);

  useEffect(() => {
    if (!isEmojiPickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!emojiPickerRef.current) return;
      if (!emojiPickerRef.current.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isEmojiPickerOpen]);

  useEffect(() => {
    if (!commentPanelOpen) {
      setIsEmojiPickerOpen(false);
    }
  }, [commentPanelOpen]);

  const handleEmojiSelect = (emoji: string) => {
    const input = commentInputRef.current;
    setCommentText(prev => {
      const start = input?.selectionStart ?? prev.length;
      const end = input?.selectionEnd ?? prev.length;
      const nextValue = `${prev.slice(0, start)}${emoji}${prev.slice(end)}`;

      const focusInput = () => {
        if (!input) return;
        const cursor = start + emoji.length;
        input.focus();
        input.setSelectionRange(cursor, cursor);
      };

      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(focusInput);
      } else {
        focusInput();
      }

      return nextValue;
    });
    setIsEmojiPickerOpen(false);
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

  // Subscribe to socket events
  useSocketEvent('new-comment', handleNewComment);
  useSocketEvent('comment-like-update', handleCommentLikeUpdate);
  useSocketEvent('comment-deleted', handleCommentDeleted);

  // Handle Tags
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentEditTag.trim()) {
      e.preventDefault();
      if (!editTags.includes(currentEditTag.trim())) {
        setEditTags([...editTags, currentEditTag.trim()]);
      }
      setCurrentEditTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  // Handle opening comment modal with video sync (using Zustand)
  const handleOpenCommentPanel = () => {
    prepareCommentPanel();
    openVideoModal(); // This preserves video state
    setCommentPanelOpen(true);
  };

  // Handle closing comment modal with video sync (using Zustand)
  const handleCloseCommentPanel = () => {
    closeVideoModal(); // This preserves video state
    setCommentPanelOpen(false);
  };

  // Handle progress bar click (using Zustand v2)
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    seekPercent(percent);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const applyCacheUpdate = useCallback(
    (nextLiked: boolean, countDelta: number) => {
      queryClient.setQueryData(["feed", "following"], (prev: PaginatedResponse<Post> | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((p) =>
            p.id === post.id
              ? {
                ...p,
                isLiked: nextLiked,
                _count: {
                  ...p._count,
                  likes: Math.max(0, (p._count?.likes || 0) + countDelta),
                },
              }
              : p
          ),
        };
      });

      queryClient.setQueryData(["discover"], (prev: any) => {
        if (!prev || !Array.isArray(prev.pages)) return prev;
        return {
          ...prev,
          pages: prev.pages.map((pg: PaginatedResponse<Post>) => ({
            ...pg,
            data: pg.data.map((p) =>
              p.id === post.id
                ? {
                  ...p,
                  isLiked: nextLiked,
                  _count: {
                    ...p._count,
                    likes: Math.max(0, (p._count?.likes || 0) + countDelta),
                  },
                }
                : p
            ),
          })),
        };
      });

      queryClient.setQueryData(["user-posts", post.author.id], (prev: PaginatedResponse<Post> | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((p) =>
            p.id === post.id
              ? {
                ...p,
                isLiked: nextLiked,
                _count: {
                  ...p._count,
                  likes: Math.max(0, (p._count?.likes || 0) + countDelta),
                },
              }
              : p
          ),
        };
      });
    },
    [post.id, post.author.id, queryClient]
  );

  const likeMutation = useMutation({
    mutationFn: async (shouldLike: boolean) => {
      if (shouldLike) {
        await apiClient.post(`/likes/posts/${post.id}`);
        return { liked: true };
      } else {
        await apiClient.delete(`/likes/posts/${post.id}`);
        return { liked: false };
      }
    },
    onMutate: async (shouldLike: boolean) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      await queryClient.cancelQueries({ queryKey: ["discover"] });
      await queryClient.cancelQueries({ queryKey: ["user-posts", post.author.id] });

      const prevLiked = isLiked;
      const prevCount = likesCount;

      const countDelta = shouldLike ? 1 : -1;
      setIsLiked(shouldLike);
      setLikesCount(prev => Math.max(0, prev + countDelta));
      setLikeBurst(true);
      setTimeout(() => setLikeBurst(false), 300);

      applyCacheUpdate(shouldLike, countDelta);

      return { prevLiked, prevCount };
    },
    onError: (err, _vars, ctx) => {
      if (ctx) {
        setIsLiked(ctx.prevLiked);
        setLikesCount(ctx.prevCount);
        applyCacheUpdate(ctx.prevLiked, ctx.prevLiked ? 1 : -1);
      }
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || "Gagal memproses like");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts", post.author.id] });
    },
  });

  const handleLikeClick = () => {
    if (likeMutation.isPending) return;
    const nextLikeState = !isLiked;
    likeMutation.mutate(nextLikeState);
  };

  const likesQuery = useQuery({
    queryKey: ["post-likes", post.id],
    queryFn: async () => {
      const res = await apiClient.get(`/posts/${post.id}/likes`);
      return (res.data || []) as Array<{ id: string; username?: string; namaLengkap?: string; profileImageUrl?: string }>
    },
    enabled: !!post.id,
    staleTime: 30000,
  });

  const fetchComments = useCallback(async ({ force }: { force?: boolean } = {}) => {
    if (isCommentsLoading) return;
    if (!force && hasLoadedComments) return;
    setIsCommentsLoading(true);
    try {
      const res = await apiClient.get(`/comments/posts/${post.id}`);
      const list = (res.data?.data || []).map((c: CommentItem) => ({
        ...c,
        isLiked: !!c.isLiked,
        _count: { likes: c._count?.likes ?? 0 },
      }));
      setComments(list);
      setHasLoadedComments(true);
    } catch (error) {
      if (force) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || "Gagal memuat komentar");
      }
    } finally {
      setIsCommentsLoading(false);
    }
  }, [post.id, hasLoadedComments, isCommentsLoading]);

  const rawVideoAspectRatio = videoData?.width && videoData?.height ? videoData.width / videoData.height : undefined;
  const metadataAspectRatio = rawVideoAspectRatio && rawVideoAspectRatio > 0 ? rawVideoAspectRatio : undefined;
  const fallbackAspectRatio = postImage ? 4 / 5 : 9 / 16;
  const safeMediaAspectRatio = (detectedMediaAspectRatio && detectedMediaAspectRatio > 0)
    ? detectedMediaAspectRatio
    : (metadataAspectRatio && metadataAspectRatio > 0 ? metadataAspectRatio : fallbackAspectRatio);
  const defaultViewport = { width: 1280, height: 900 };
  const effectiveViewportHeight = viewportSize.height || defaultViewport.height;
  const effectiveViewportWidth = viewportSize.width || defaultViewport.width;
  const modalHeightLimit = Math.min(effectiveViewportHeight * 0.9, 900);
  const leftPanelWidthLimit = Math.max(Math.min(effectiveViewportWidth - 380, 900), 360);
  const widthFromHeight = modalHeightLimit * safeMediaAspectRatio;
  const computedMediaBoxWidth = Math.min(leftPanelWidthLimit, widthFromHeight);
  const computedMediaBoxHeight = computedMediaBoxWidth / safeMediaAspectRatio;
  const safeMediaBoxWidth = Number.isFinite(computedMediaBoxWidth) && computedMediaBoxWidth > 0 ? computedMediaBoxWidth : 520;
  const safeMediaBoxHeight = Number.isFinite(computedMediaBoxHeight) && computedMediaBoxHeight > 0 ? Math.min(computedMediaBoxHeight, modalHeightLimit) : Math.min(520 / safeMediaAspectRatio, modalHeightLimit);
  const mediaBoxStyle: CSSProperties = { width: `${safeMediaBoxWidth}px`, height: `${safeMediaBoxHeight}px`, maxHeight: `${modalHeightLimit}px` };

  const shouldLoadComments = (prefetchComments || isCommentPanelPrepared || commentPanelOpen) && !hasLoadedComments;

  useEffect(() => {
    if (shouldLoadComments && !isCommentsLoading) {
      fetchComments();
    }
  }, [shouldLoadComments, isCommentsLoading, fetchComments]);

  const sendComment = async () => {
    const plain = commentText.replace(/<[^>]+>/g, '').trim();
    if (!plain) {
      toast.error("Komentar tidak boleh kosong");
      return;
    }
    setIsCommentSending(true);
    try {
      await apiClient.post(`/comments/posts/${post.id}`, { content: commentText });
      setCommentText("");
      await fetchComments({ force: true });
      toast.success("Komentar terkirim");
    } catch (e) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || "Gagal mengirim komentar");
    } finally {
      setIsCommentSending(false);
    }
  };

  const sendReply = async (parentId: string) => {
    const plain = replyText.replace(/<[^>]+>/g, '').trim();
    if (!plain) {
      toast.error("Balasan tidak boleh kosong");
      return;
    }
    setIsCommentSending(true);
    try {
      const response = await apiClient.post(`/comments/posts/${post.id}`, { content: replyText, parentId });
      const newReply = response.data as CommentItem;

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
      toast.success("Balasan terkirim");
    } catch (e) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || "Gagal mengirim balasan");
    } finally {
      setIsCommentSending(false);
    }
  };

  const commentLikeMutation = useMutation({
    mutationFn: async ({ commentId, shouldLike }: { commentId: string; shouldLike: boolean }) => {
      if (shouldLike) {
        await apiClient.post(`/comments/likes/${commentId}`);
        return { liked: true };
      } else {
        await apiClient.delete(`/comments/likes/${commentId}`);
        return { liked: false };
      }
    },
    onMutate: async ({ commentId, shouldLike }) => {
      const prev = comments;
      const prevReplies = repliesMap;

      // Check if it's a reply or a main comment
      let isReply = false;
      let parentId = '';

      for (const [pId, replies] of repliesMap.entries()) {
        if (replies.some(r => r.id === commentId)) {
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
            (next.get(parentId) || []).map(r =>
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
        setComments((curr) =>
          curr.map((c) =>
            c.id === commentId
              ? {
                ...c,
                isLiked: shouldLike,
                _count: { ...c._count, likes: Math.max(0, (c._count?.likes || 0) + (shouldLike ? 1 : -1)) },
              }
              : c
          )
        );
      }

      return { prev, prevReplies };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) setComments(ctx.prev);
      if (ctx?.prevReplies) setRepliesMap(ctx.prevReplies);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || "Gagal memproses like komentar");
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
      toast.error(axiosErr?.response?.data?.message || "Gagal menghapus komentar");
    },
    onSuccess: () => {
      toast.success("Komentar berhasil dihapus");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { content: string; title?: string; tags?: string[] }) => {
      return apiClient.put(`/posts/${post.id}`, payload);
    },
    onSuccess: (res) => {
      const anyRes = res as unknown as { data?: { content?: string; title?: string; hashtags?: string[] } };
      const newContent = anyRes?.data?.content ?? editContent;
      const newTitle = anyRes?.data?.title ?? editTitle;
      const newTags = anyRes?.data?.hashtags ?? editTags;

      setUpdatedContent(newContent);
      setUpdatedTitle(newTitle);
      setUpdatedTags(newTags);

      toast.success("Postingan berhasil diperbarui");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
    },
    onError: (error) => {
      const err = error as unknown as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Gagal memperbarui postingan");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/posts/${post.id}`);
    },
    onSuccess: () => {
      toast.success("Postingan berhasil dihapus");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
    },
    onError: (error) => {
      const err = error as unknown as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Gagal menghapus postingan");
    },
  });

  // Explore context render
  if (context === 'explore') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${username}`}>
              <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden relative ring-1 ring-slate-100">
                {avatar ? (
                  <Image src={avatar} alt={username} fill sizes="32px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-emerald-600 font-bold text-xs">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
            <Link href={`/profile/${username}`} className="text-sm font-semibold text-blue-600 hover:underline">
              @{username}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {!isOwner && (
              <FollowButton targetUsername={username} initialIsFollowing={post.isFollowing || false} />
            )}
            <button className="text-slate-900 hover:opacity-60 p-1">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 border-b border-slate-100">
          <div className="flex gap-3 mb-4">
            <Link href={`/profile/${username}`} className="shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden relative">
                {avatar ? (
                  <Image src={avatar} alt={username} fill sizes="32px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-emerald-600 font-bold text-xs">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
            <div className="text-sm">
              <span className="font-semibold text-slate-900 mr-2">{username}</span>
              {titleToDisplay && (
                <h3 className="font-bold text-slate-900 mb-2 mt-1 text-base leading-tight line-clamp-2" title={titleToDisplay}>{titleToDisplay}</h3>
              )}

              <div className="text-slate-800 whitespace-pre-wrap break-words leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline" dangerouslySetInnerHTML={{ __html: contentToDisplay }} />

              <div className="flex flex-col gap-1 mt-2">
                {post.links && post.links.length > 0 ? (
                  post.links.map((link, index) => (
                    <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-sm block truncate">
                      {link}
                    </a>
                  ))
                ) : null}
              </div>

              {tagsToDisplay && tagsToDisplay.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tagsToDisplay.map((tag) => (
                    <span key={tag} className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full hover:bg-blue-100 transition-colors cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-1 text-xs text-slate-500">{formatRelativeTime(post.createdAt)}</div>
            </div>
          </div>

          {(post._count?.comments || 0) > 0 && (
            <div className="py-4 text-center text-sm text-slate-500">
              View all {post._count?.comments} comments
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button onClick={handleLikeClick} disabled={likeMutation.isPending} className={`hover:opacity-60 transition-all ${likeBurst ? 'scale-110' : 'scale-100'}`}>
                <Heart className={`w-6 h-6 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-slate-900"}`} />
              </button>
              <button className="hover:opacity-60 transition-opacity">
                <MessageCircle className="w-6 h-6 text-slate-900" />
              </button>
              <button className="hover:opacity-60 transition-opacity">
                <Send className="w-6 h-6 text-slate-900" />
              </button>
            </div>
            <button className="hover:opacity-60 transition-opacity">
              <Bookmark className="w-6 h-6 text-slate-900" />
            </button>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <button onClick={() => setLikesOpen(true)} className="text-sm font-semibold text-slate-900 hover:underline">
              {likesCount.toLocaleString()} likes
            </button>
            {isLiked && (
              <span className="text-[11px] font-bold text-red-600">Liked by you</span>
            )}
          </div>
          <div className="mb-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
              {formatRelativeTime(post.createdAt)} ago
            </span>
          </div>
          <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
            <Smile className="w-6 h-6 text-slate-400" />
            <input type="text" placeholder="Add a comment..." className="text-sm w-full outline-none placeholder:text-slate-500 bg-transparent" />
            <button className="text-sm font-semibold text-blue-500 hover:text-blue-700 opacity-50 hover:opacity-100 disabled:opacity-30">Post</button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Feed Card
  return (
    <>
      <article id={`post-${post.id}`} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${username}`}>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden relative ring-1 ring-slate-100 dark:ring-slate-600">
                {avatar ? (
                  <Image src={avatar} alt={username} fill sizes="32px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-emerald-600 dark:text-indigo-400 font-bold text-xs">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1">
                <Link href={`/profile/${username}`} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  @{username}
                </Link>
                <span className="text-xs text-slate-500 dark:text-slate-400">• {formatRelativeTime(post.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            {(context === 'profile' && isOwner) || isOwner ? (
              <>
                <button onClick={() => setMenuOpen((v) => !v)} className="text-slate-900 dark:text-slate-100 hover:opacity-60 p-1">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl py-1 z-20">
                    <button
                      onClick={() => { setMenuOpen(false); setEditOpen(true); setEditContent(contentToDisplay); }}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                    >
                      Edit Post
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-0"></div>
                    <button
                      onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button className="text-slate-900 dark:text-slate-100 hover:opacity-60 p-1">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {(postVideo || postImage) && (
          <div className="relative w-full border-y border-slate-100 flex items-center justify-center overflow-hidden">
            {postVideo && videoData ? (
              <FeedVideoPlayer
                postId={post.id}
                video={{
                  id: videoData.id,
                  url: normalizeVideoUrl(videoData.url),
                  originalUrl: normalizeVideoUrl(videoData.originalUrl),
                  processedUrl: normalizeVideoUrl(videoData.processedUrl),
                  thumbnailUrl: normalizeVideoUrl(videoData.thumbnailUrl),
                  status: videoData.status || 'READY',
                  qualityUrls: videoData.qualityUrls ? {
                    '144p': videoData.qualityUrls['144p'] ? normalizeVideoUrl(videoData.qualityUrls['144p']) : undefined,
                    '240p': videoData.qualityUrls['240p'] ? normalizeVideoUrl(videoData.qualityUrls['240p']) : undefined,
                    '360p': videoData.qualityUrls['360p'] ? normalizeVideoUrl(videoData.qualityUrls['360p']) : undefined,
                    '480p': videoData.qualityUrls['480p'] ? normalizeVideoUrl(videoData.qualityUrls['480p']) : undefined,
                    '720p': videoData.qualityUrls['720p'] ? normalizeVideoUrl(videoData.qualityUrls['720p']) : undefined,
                  } : null,
                }}
                className="w-full aspect-[4/5] max-h-[600px]"
              />
            ) : postVideo ? (
              <FeedVideoPlayer
                postId={post.id}
                video={{
                  id: 'fallback-video',
                  url: normalizeVideoUrl(postVideo),
                }}
                className="w-full aspect-[4/5] max-h-[600px]"
              />
            ) : (
              <div className="relative w-full bg-slate-900">
                <Image src={postImageThumbnail!} alt="Post content" width={1080} height={1080} sizes="(max-width: 768px) 100vw, 600px" className="w-full h-auto object-contain" />
              </div>
            )}
          </div>
        )}

        <div className="px-4 py-3 pb-0">
          <div className="mb-2">
            <div className="text-sm text-slate-900 dark:text-white">
              {titleToDisplay && (
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 mt-1 leading-tight line-clamp-2" title={titleToDisplay}>
                  {titleToDisplay}
                </h3>
              )}

              {/* Truncatable Description */}
              {contentToDisplay && (
                <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                  {!isDescriptionExpanded && shouldTruncate ? (
                    <>
                      <span
                        className="whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{
                          __html: contentToDisplay.replace(/<[^>]+>/g, '').slice(0, MAX_DESCRIPTION_LENGTH) + '...'
                        }}
                      />
                      <button
                        onClick={() => setIsDescriptionExpanded(true)}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white ml-1 font-medium"
                      >
                        more
                      </button>
                    </>
                  ) : (
                    <div
                      className="whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-a:text-emerald-600 dark:prose-a:text-indigo-400"
                      dangerouslySetInnerHTML={{ __html: contentToDisplay }}
                    />
                  )}
                </div>
              )}

              {/* Tags - only show when expanded or no truncation */}
              {(isDescriptionExpanded || !shouldTruncate) && tagsToDisplay && tagsToDisplay.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tagsToDisplay.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer px-2 py-0.5"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLikeClick}
                disabled={likeMutation.isPending}
                aria-label={isLiked ? 'Unlike' : 'Like'}
                className={`relative group transition-transform duration-200 ${likeBurst ? 'scale-125' : 'scale-100'} active:scale-95 disabled:opacity-50`}
              >
                <Heart className={`w-6 h-6 transition-all duration-200 ${isLiked ? "fill-red-500 text-red-500" : "text-slate-900 dark:text-white"}`} />
              </button>
              <button
                onClick={handleOpenCommentPanel}
                onMouseEnter={prepareCommentPanel}
                onFocus={prepareCommentPanel}
                onTouchStart={prepareCommentPanel}
                className="hover:opacity-60 transition-opacity"
              >
                <MessageCircle className="w-6 h-6 text-slate-900 dark:text-white" />
              </button>
              <button onClick={() => { setShareOpen(true); setCopied(false); const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/post/${post.id}`; setShareUrl(url); }} className="hover:opacity-60 transition-opacity">
                <Send className="w-6 h-6 text-slate-900 dark:text-white" />
              </button>
            </div>
            <button className="hover:opacity-60 transition-opacity">
              <Bookmark className="w-6 h-6 text-slate-900 dark:text-white" />
            </button>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <button onClick={() => setLikesOpen(true)} className="text-sm font-semibold text-slate-900 dark:text-white hover:underline">
              {likesCount.toLocaleString()} likes
            </button>
          </div>

          {/* View all comments link - Instagram style */}
          {(post._count?.comments || 0) > 0 && (
            <button
              onClick={handleOpenCommentPanel}
              onMouseEnter={prepareCommentPanel}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 mb-2 block"
            >
              View all {post._count?.comments} comments
            </button>
          )}

          <div className="mb-3">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>
      </article>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} contentClassName="max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Edit Post</h2>
          <button onClick={() => setEditOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Judul Postingan"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Konten</label>
            {post.type === 'text' || (!post.images?.[0]) ? (
              <RichTextEditor content={editContent} onChange={setEditContent} placeholder="Edit konten..." />
            ) : (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit caption..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder:text-slate-400 text-sm resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
            <div className="relative">
              <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[42px]">
                {editTags.map(tag => (
                  <span key={tag} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <input
                  value={currentEditTag}
                  onChange={(e) => setCurrentEditTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={editTags.length === 0 ? "Tambah tags (tekan Enter)" : ""}
                  className="bg-transparent outline-none text-sm flex-1 min-w-[100px]"
                />
              </div>
              <Tag className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={() => setEditOpen(false)} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-colors">Cancel</button>
          <button
            onClick={() => updateMutation.mutate({ content: editContent, title: editTitle, tags: editTags })}
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
          >
            {updateMutation.isPending ? 'Saving...' : 'Done'}
          </button>
        </div>
      </Modal>

      {/* Likes Modal */}
      <Modal open={likesOpen} onClose={() => setLikesOpen(false)} contentClassName="max-w-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Likes</h3>
          <button onClick={() => setLikesOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {likesQuery.isLoading ? (
            <div className="text-sm text-slate-500">Memuat...</div>
          ) : (
            (likesQuery.data || []).map((like) => {
              const likedId = like?.id || '';
              const likedUsername = like?.username || '';
              const likedFullName = like?.namaLengkap || '';
              const likedAvatar = like?.profileImageUrl || '';
              const isMe = user?.id && likedId === user.id;
              const displayName = likedFullName || likedUsername || 'Pengguna';
              const handle = likedUsername ? `@${likedUsername}` : isMe ? 'Anda' : '';
              const initial = (likedFullName || likedUsername || 'U').charAt(0).toUpperCase();
              const profileHref = likedUsername ? `/profile/${likedUsername}` : '#';
              return (
                <div key={likedId} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <Link href={profileHref} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100">
                      {likedAvatar ? (
                        <Image src={likedAvatar} alt={displayName} width={36} height={36} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-emerald-600 text-xs font-bold">
                          {initial}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{displayName}</span>
                      {handle && <span className="text-xs text-blue-600">{handle}</span>}
                    </div>
                  </Link>
                  {!isMe && likedUsername && (
                    <FollowButton targetUsername={likedUsername} initialIsFollowing={false} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} contentClassName="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Post?</h3>
          <p className="text-sm text-slate-500">Are you sure you want to delete this post? This action cannot be undone.</p>
        </div>
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
          <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
          <button onClick={() => setDeleteOpen(false)} className="w-full py-3 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">Cancel</button>
        </div>
      </Modal>

      {/* Delete Comment Modal - Using Portal to render at body level */}
      <PortalModal open={!!deleteCommentId} onClose={() => setDeleteCommentId(null)} contentClassName="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Komentar?</h3>
          <p className="text-sm text-slate-500">Komentar yang dihapus tidak dapat dikembalikan.</p>
        </div>
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
          <button
            onClick={() => {
              if (deleteCommentId) {
                deleteCommentMutation.mutate(deleteCommentId);
                setDeleteCommentId(null);
              }
            }}
            disabled={deleteCommentMutation.isPending}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {deleteCommentMutation.isPending ? 'Menghapus...' : 'Hapus'}
          </button>
          <button onClick={() => setDeleteCommentId(null)} className="w-full py-3 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">Batal</button>
        </div>
      </PortalModal>

      {/* Share Modal */}
      <Modal open={shareOpen} onClose={() => setShareOpen(false)} contentClassName="max-w-md">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Share Post</h3>
          <button onClick={() => setShareOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-900 dark:text-white" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-sm text-slate-600 dark:text-slate-400">Copy link untuk dibagikan:</div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
            <input value={shareUrl || ''} readOnly className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100" />
            <button onClick={() => { if (shareUrl) { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } }} className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-2">
              {copied ? (<><Check className="w-4 h-4" /> Copied</>) : (<><Copy className="w-4 h-4" /> Copy</>)}
            </button>
          </div>
        </div>
      </Modal>

      {/* Comment Panel Modal - Instagram Style Layout */}
      <Modal
        open={commentPanelOpen}
        onClose={handleCloseCommentPanel}
        contentClassName="w-full max-w-[1100px] max-h-[90vh] flex items-stretch bg-white dark:bg-slate-950 mx-auto overflow-hidden rounded-xl"
        keepMounted={isCommentPanelPrepared}
      >
        {/* Left Panel - Media dengan ukuran proporsional ala Instagram */}
        <div className="hidden md:flex flex-[2] min-w-0 items-center justify-center bg-slate-900">
          {hasMedia ? (
            <div className="relative flex items-center justify-center" style={mediaBoxStyle}>
              {postImage ? (
                <Image
                  src={postImage!}
                  alt="Post media"
                  width={1080}
                  height={1350}
                  sizes="(max-width: 768px) 100vw, 700px"
                  className="w-full h-full object-contain"
                  onLoadingComplete={({ naturalWidth, naturalHeight }) => {
                    if (naturalWidth && naturalHeight) {
                      setDetectedMediaAspectRatio(naturalWidth / naturalHeight);
                    }
                  }}
                />
              ) : (
                <ModalVideoMirror
                  postId={post.id}
                  src={normalizeVideoUrl(videoData?.processedUrl || videoData?.originalUrl || postVideo)}
                  poster={normalizeVideoUrl(videoData?.thumbnailUrl)}
                  className="w-full h-full"
                  fit="contain"
                  onAspectRatio={(ratio) => {
                    if (ratio > 0) {
                      setDetectedMediaAspectRatio(ratio);
                    }
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center text-slate-400 text-sm h-full py-10">Tidak ada media</div>
          )}
        </div>

        {/* Right Panel - Post Info & Comments */}
        <div className="w-full md:flex-[1] md:min-w-[360px] md:max-w-[420px] bg-white dark:bg-slate-950 flex flex-col flex-shrink-0 max-h-[90vh]">
          {/* Header - Author Info */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0">
            <Link href={`/profile/${username}`} className="shrink-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 ring-2 ring-pink-100 dark:ring-slate-700">
                {avatar ? (
                  <Image src={avatar} alt={username} width={32} height={32} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">{username.charAt(0).toUpperCase()}</div>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${username}`} className="font-semibold text-sm text-slate-900 dark:text-white hover:opacity-70">
                {username}
              </Link>
            </div>
            <button className="p-1 hover:opacity-60">
              <MoreHorizontal className="w-5 h-5 text-slate-900 dark:text-white" />
            </button>
          </div>

          {/* Scrollable Content Area - Caption + Comments */}
          <div className="flex-1 overflow-y-auto">
            {/* Caption Section - Compact tanpa duplikat avatar */}
            {(titleToDisplay || contentToDisplay || (tagsToDisplay && tagsToDisplay.length > 0)) && (
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-sm text-slate-800 dark:text-slate-200">
                  {/* Title */}
                  {titleToDisplay && (
                    <span className="font-bold text-slate-900 dark:text-white mr-1">{titleToDisplay}</span>
                  )}
                  {/* Description - inline */}
                  {contentToDisplay && (
                    <span className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: contentToDisplay }} />
                  )}
                </div>

                {/* Tags */}
                {tagsToDisplay && tagsToDisplay.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tagsToDisplay.map((t) => (
                      <span key={t} className="text-blue-500 dark:text-blue-400 text-sm hover:opacity-70 cursor-pointer">#{t}</span>
                    ))}
                  </div>
                )}

                {/* Time */}
                <div className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  {formatRelativeTime(post.createdAt)}
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="p-3 space-y-4">
              {isCommentsLoading && comments.length === 0 && (
                <div className="text-center text-slate-400 dark:text-slate-500 text-sm py-6">Memuat komentar…</div>
              )}

              {!isCommentsLoading && comments.length === 0 && (
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
                        <span>{formatRelativeTime(c.createdAt || new Date().toISOString())}</span>
                        <button onClick={() => setReplyFor(replyFor === c.id ? null : c.id)} className="font-semibold hover:text-slate-900 dark:hover:text-white">Balas</button>
                        <button
                          onClick={() => {
                            if (!user) { toast.error('Harus login untuk menyukai komentar'); return; }
                            if (commentLikeMutation.isPending) return;
                            const shouldLike = !c.isLiked;
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
                                        <Image src={rAvatar} alt={rUsername} width={24} height={24} className="w-full h-full object-cover" />
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
                                      <span>{formatRelativeTime(reply.createdAt || new Date().toISOString())}</span>
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
                          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`Balas @${cUsername}...`} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-16 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-slate-100 placeholder:text-slate-400 resize-none" rows={1} />
                          <button onClick={() => sendReply(c.id)} disabled={isCommentSending} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 text-sm font-semibold hover:text-blue-600 disabled:opacity-50">{isCommentSending ? '...' : 'Kirim'}</button>
                        </div>
                      )}
                    </div>
                    {/* Like icon di kanan */}
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

          {/* Form Komentar - Fixed di Bottom (Instagram Style) */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  aria-label="Buka pemilih emoji"
                >
                  <Smile className="w-6 h-6" />
                </button>
                {isEmojiPickerOpen && (
                  <div className="absolute bottom-11 left-0 z-40 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
                    <div className="grid grid-cols-6 gap-2 p-3 text-2xl">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          type="button"
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="transition-transform hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="px-3 pb-2 text-[10px] text-center uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Emoji favorit
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={commentInputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Tambahkan komentar..."
                className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100 placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendComment();
                  }
                }}
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
      </Modal>
    </>
  );
}

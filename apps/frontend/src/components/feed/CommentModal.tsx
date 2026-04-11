"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Smile, ThumbsUp, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import useAuthStore from "@/store/auth";
import type { Post } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { OptimizedVideoPlayer } from "@/components/OptimizedVideoPlayer";
import { useVideoPlaybackStore } from "@/store/videoPlaybackV2";
import { resolveMediaUrl } from "@/lib/media-url";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  parentId?: string | null;
  user: { id: string; profile?: { username: string; profileImageUrl: string | null } };
  _count?: { likes: number; replies: number };
  isLiked?: boolean;
}

interface CommentModalProps {
  post: Post;
  layoutId: string;
  onClose: () => void;
}

const EMOJIS = ["😊", "❤️", "🙏", "✨", "😂", "🔥", "👏", "😍", "💯", "🥹", "😎", "🎉"];

function Avatar({
  src,
  name,
  size = 36,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  const initial = (name || "U").charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name} width={size} height={size} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-white font-bold"
          style={{ fontSize: size * 0.38 }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CommentModal({ post, layoutId: _layoutId, onClose }: CommentModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const playbackStore = useVideoPlaybackStore;
  const activePostId = useVideoPlaybackStore((state) => state.activePostId);
  const currentTime = useVideoPlaybackStore((state) => state.currentTime);
  const isPlaying = useVideoPlaybackStore((state) => state.isPlaying);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Map<string, Comment[]>>(new Map());
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [isLiked, setIsLiked] = useState(!!post.isLiked);
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    playbackStore.getState().openModal();
    return () => {
      playbackStore.getState().closeModal();
    };
  }, [playbackStore]);

  // Derive media
  const postImage = resolveMediaUrl((post.images?.[0] as { url?: string })?.url ?? null) || null;
  const firstVideo = post.videos?.[0] as {
    id: string;
    url?: string;
    originalUrl?: string | null;
    processedUrl?: string | null;
    thumbnailUrl?: string | null;
    thumbnail?: string | null;
    qualityUrls?: Record<string, string | null | undefined> | null;
    width?: number | null;
    height?: number | null;
    status?: 'READY' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  } | undefined;
  const postVideo = firstVideo?.processedUrl
    ?? firstVideo?.originalUrl
    ?? firstVideo?.url
    ?? null;
  const hasMedia = !!(postImage || postVideo);
  const username = post.author?.profile?.username || "user";
  const avatar = post.author?.profile?.profileImageUrl;

  const videoAspectClass = (() => {
    if (!firstVideo?.width || !firstVideo?.height) return 'aspect-[9/16]';
    const ratio = firstVideo.width / firstVideo.height;
    if (ratio >= 1.7) return 'aspect-video';
    if (ratio >= 1.2) return 'aspect-[4/3]';
    if (ratio >= 0.9) return 'aspect-square';
    if (ratio >= 0.7) return 'aspect-[4/5]';
    return 'aspect-[9/16]';
  })();

  const videoFitMode: 'cover' | 'contain' = (() => {
    return 'contain';
  })();

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["comments", post.id],
    queryFn: async () => {
      const res = await apiClient.get(`/comments/posts/${post.id}`);
      return (res.data?.data ?? res.data ?? []).map((c: Comment) => ({
        ...c,
        isLiked: !!c.isLiked,
        _count: { likes: c._count?.likes ?? 0, replies: c._count?.replies ?? 0 },
      }));
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (shouldLike: boolean) => {
      if (shouldLike) await apiClient.post(`/likes/posts/${post.id}`);
      else await apiClient.delete(`/likes/posts/${post.id}`);
    },
    onMutate: (shouldLike) => {
      setIsLiked(shouldLike);
      setLikesCount((prev) => Math.max(0, prev + (shouldLike ? 1 : -1)));
    },
    onError: (_, shouldLike) => {
      setIsLiked(!shouldLike);
      setLikesCount((prev) => Math.max(0, prev + (shouldLike ? -1 : 1)));
      toast.error("Gagal memproses like");
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked
        ? apiClient.delete(`/comments/likes/${id}`)
        : apiClient.post(`/comments/likes/${id}`),
    onMutate: ({ id, liked }) => {
      queryClient.setQueryData<Comment[]>(["comments", post.id], (prev = []) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, isLiked: !liked, _count: { likes: Math.max(0, (c._count?.likes ?? 0) + (liked ? -1 : 1)), replies: c._count?.replies ?? 0 } }
            : c
        )
      );
      // Also update in repliesMap
      setRepliesMap((prev) => {
        const next = new Map(prev);
        for (const [parentId, replies] of next.entries()) {
          if (replies.some((r) => r.id === id)) {
            next.set(
              parentId,
              replies.map((r) =>
                r.id === id
                  ? { ...r, isLiked: !liked, _count: { likes: Math.max(0, (r._count?.likes ?? 0) + (liked ? -1 : 1)), replies: r._count?.replies ?? 0 } }
                  : r
              )
            );
          }
        }
        return next;
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      toast.error("Gagal memproses like komentar");
    },
  });

  // Send comment
  const sendComment = async () => {
    if (!text.trim() || sending) return;
    if (!user) { toast.error("Harus login"); return; }
    setSending(true);
    try {
      await apiClient.post(`/comments/posts/${post.id}`, { content: text.trim() });
      setText("");
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch {
      toast.error("Gagal mengirim komentar");
    } finally {
      setSending(false);
    }
  };

  // Send reply
  const sendReply = async (parentId: string) => {
    if (!replyText.trim() || sending) return;
    if (!user) { toast.error("Harus login"); return; }
    setSending(true);
    try {
      const res = await apiClient.post(`/comments/posts/${post.id}`, { content: replyText.trim(), parentId });
      const newReply = { ...res.data, isLiked: false, _count: { likes: 0, replies: 0 } };
      setRepliesMap((prev) => {
        const next = new Map(prev);
        next.set(parentId, [...(next.get(parentId) || []), newReply]);
        return next;
      });
      setExpandedReplies((prev) => new Set(prev).add(parentId));
      setReplyText("");
      setReplyFor(null);
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
    } catch {
      toast.error("Gagal mengirim balasan");
    } finally {
      setSending(false);
    }
  };

  // Fetch replies
  const fetchReplies = async (commentId: string) => {
    setLoadingReplies((prev) => new Set(prev).add(commentId));
    try {
      const res = await apiClient.get(`/comments/${commentId}/replies`);
      setRepliesMap((prev) => {
        const next = new Map(prev);
        next.set(
          commentId,
          (res.data?.data || []).map((r: Comment) => ({
            ...r,
            isLiked: !!r.isLiked,
            _count: { likes: r._count?.likes ?? 0, replies: 0 },
          }))
        );
        return next;
      });
    } catch {
      toast.error("Gagal memuat balasan");
    } finally {
      setLoadingReplies((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const toggleReplies = (commentId: string) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies((prev) => { const n = new Set(prev); n.delete(commentId); return n; });
    } else {
      setExpandedReplies((prev) => new Set(prev).add(commentId));
      if (!repliesMap.has(commentId)) fetchReplies(commentId);
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string) => {
    try {
      await apiClient.delete(`/comments/${commentId}`);
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      toast.success("Komentar dihapus");
    } catch {
      toast.error("Gagal hapus komentar");
    }
  };

  // Auto focus + escape key
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-0 sm:p-4 pointer-events-none">
        <motion.div
          key="modal"
          className="pointer-events-auto bg-white dark:bg-[#242526] w-full shadow-2xl overflow-hidden flex flex-col"
          style={{
            height: "92vh",
            maxHeight: "92vh",
            maxWidth: "680px",
            borderRadius: "12px",
          }}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 24 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        >
          {/* Header top — "Postingan username" + close */}
          <div className="shrink-0 relative flex items-center justify-center px-4 py-3 border-b border-slate-200 dark:border-[#3E4042]">
            <span className="font-bold text-base text-slate-900 dark:text-[#E4E6EB]">
              Postingan {username}
            </span>
            <button
              onClick={onClose}
              className="absolute right-3 p-1.5 rounded-full bg-slate-100 dark:bg-[#3A3B3C] hover:bg-slate-200 dark:hover:bg-[#4E4F50] transition-colors text-slate-600 dark:text-[#B0B3B8]"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-header — avatar + username + time */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-3">
            <Link href={`/profile/${username}`} onClick={onClose}>
              <Avatar src={avatar} name={username} size={40} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${username}`}
                onClick={onClose}
                className="font-semibold text-sm text-slate-900 dark:text-[#E4E6EB] hover:underline block truncate"
              >
                {username}
              </Link>
              <span className="text-xs text-slate-500 dark:text-[#B0B3B8]">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-t border-slate-200 dark:border-[#3E4042]">
            <div className="flex-1 min-h-0 overflow-y-auto">
            {hasMedia && (
              <div className="relative w-full bg-black overflow-hidden">
                {firstVideo ? (
                  <OptimizedVideoPlayer
                    postId={post.id}
                    video={{
                      id: firstVideo.id,
                      url: resolveMediaUrl(firstVideo.url),
                      originalUrl: resolveMediaUrl(firstVideo.originalUrl),
                      processedUrl: resolveMediaUrl(firstVideo.processedUrl),
                      thumbnailUrl: resolveMediaUrl(firstVideo.thumbnailUrl ?? firstVideo.thumbnail),
                      status: firstVideo.status || 'READY',
                      qualityUrls: firstVideo.qualityUrls
                        ? Object.fromEntries(
                            Object.entries(firstVideo.qualityUrls).map(([quality, url]) => [quality, resolveMediaUrl(url)])
                          ) as NonNullable<typeof firstVideo.qualityUrls>
                        : null,
                    }}
                    initialTime={post.id === activePostId ? currentTime : 0}
                    autoResume={post.id === activePostId ? isPlaying : false}
                    fit={videoFitMode}
                    eager
                    className={`w-full ${videoAspectClass} max-h-[600px]`}
                  />
                ) : (
                  <Image
                    src={postImage!}
                    alt="Post"
                    width={680}
                    height={520}
                    className="w-full h-auto object-contain max-h-[600px]"
                  />
                )}
              </div>
            )}

            {/* Post title + content */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-[#3E4042]">
              {post.title && (
                <h3 className="text-xl font-bold text-slate-900 dark:text-[#E4E6EB] mb-2 leading-tight">{post.title}</h3>
              )}
              {post.content && !post.background && (
                <div
                  className="text-[15px] text-slate-800 dark:text-[#E4E6EB] leading-relaxed whitespace-pre-wrap break-words prose prose-base dark:prose-invert max-w-none prose-p:my-1 prose-a:text-emerald-600 dark:prose-a:text-indigo-400"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              )}
              {post.content && post.background && (
                <div
                  className="rounded-2xl flex items-center justify-center min-h-[400px] px-10 py-12 text-center"
                  style={{ background: post.background }}
                >
                  <p className="text-white text-2xl font-bold leading-snug break-words whitespace-pre-wrap drop-shadow-sm">
                    {post.content.replace(/<[^>]+>/g, "")}
                  </p>
                </div>
              )}
              {/* Tags */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {post.hashtags.map((t) => (
                    <span key={t} className="inline-flex items-center px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 text-sm rounded-full hover:opacity-70 cursor-pointer">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Counts row */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-[#B0B3B8]">
                <span>{likesCount > 0 ? `${likesCount.toLocaleString()} suka` : ""}</span>
                <span>{comments.length > 0 ? `${comments.length} komentar` : ""}</span>
              </div>

              {/* Action buttons — Facebook-style */}
              <div className="mt-3 flex items-center gap-1 border-t border-b border-slate-200 dark:border-[#3E4042] py-0.5">
                <button
                  onClick={() => {
                    if (!user) { toast.error("Harus login"); return; }
                    likePostMutation.mutate(!isLiked);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-[#3A3B3C] ${isLiked ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-[#B0B3B8]"}`}
                >
                  <ThumbsUp className={`w-[18px] h-[18px] ${isLiked ? "fill-blue-600 dark:fill-blue-400" : ""}`} />
                  Suka
                </button>
                <button
                  onClick={() => setTimeout(() => inputRef.current?.focus(), 50)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-[#B0B3B8] hover:bg-slate-100 dark:hover:bg-[#3A3B3C] transition-colors"
                >
                  <MessageCircle className="w-[18px] h-[18px]" />
                  Komentar
                </button>
              </div>
            </div>

            {/* Comments list — scrollable */}
            <div className="px-4 py-3 space-y-4">
              {isLoading && (
                <div className="text-center py-8 text-slate-400 dark:text-[#B0B3B8] text-sm">
                  <div className="inline-flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <p className="mt-2">Memuat komentar…</p>
                </div>
              )}
              {!isLoading && comments.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-[#3A3B3C] flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-900 dark:text-[#E4E6EB] font-semibold text-base mb-1">Belum ada komentar</p>
                  <p className="text-slate-500 dark:text-[#B0B3B8] text-sm">Jadilah yang pertama berkomentar.</p>
                </div>
              )}

              {comments.map((c) => {
                const cu = c.user?.profile?.username || "user";
                const ca = c.user?.profile?.profileImageUrl;
                const isOwn = user?.id === (c.userId || c.user?.id);
                const replyCount = c._count?.replies ?? 0;
                const isExpanded = expandedReplies.has(c.id);
                const loadedReplies = repliesMap.get(c.id) || [];

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2.5"
                  >
                    <Link href={`/profile/${cu}`} onClick={onClose} className="shrink-0 mt-0.5">
                      <Avatar src={ca} name={cu} size={36} />
                    </Link>
                    <div className="flex-1 min-w-0">
                      {/* Comment bubble */}
                      <div className="inline-block max-w-full bg-slate-100 dark:bg-[#3A3B3C] rounded-2xl px-3 py-2">
                        <Link
                          href={`/profile/${cu}`}
                          onClick={onClose}
                          className="font-semibold text-sm text-slate-900 dark:text-[#E4E6EB] hover:underline block"
                        >
                          {cu}
                        </Link>
                        <p className="text-sm text-slate-800 dark:text-[#E4E6EB] break-words">{c.content}</p>
                      </div>

                      {/* Comment meta row */}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-[#B0B3B8] px-1">
                        <span>{formatRelativeTime(c.createdAt)}</span>
                        <button
                          onClick={() => {
                            if (!user) { toast.error("Harus login"); return; }
                            likeCommentMutation.mutate({ id: c.id, liked: !!c.isLiked });
                          }}
                          className={`font-semibold transition-colors hover:text-slate-900 dark:hover:text-white ${c.isLiked ? "text-blue-500" : ""}`}
                        >
                          Suka {(c._count?.likes ?? 0) > 0 ? `· ${c._count!.likes}` : ""}
                        </button>
                        <button
                          onClick={() => setReplyFor(replyFor === c.id ? null : c.id)}
                          className="font-semibold hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          Balas
                        </button>
                        {isOwn && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="text-red-500 hover:text-red-700 font-semibold transition-colors"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      {/* Show/hide replies */}
                      {replyCount > 0 && (
                        <button
                          onClick={() => toggleReplies(c.id)}
                          className="mt-1 px-1 flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {isExpanded
                            ? "Sembunyikan balasan"
                            : `${loadingReplies.has(c.id) ? "Memuat..." : `${replyCount} balasan`}`}
                        </button>
                      )}

                      {/* Replies */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 ml-3 space-y-3 overflow-hidden"
                          >
                            {loadedReplies.map((r) => {
                              const ru = r.user?.profile?.username || "user";
                              const ra = r.user?.profile?.profileImageUrl;
                              const isOwnReply = user?.id === (r.userId || r.user?.id);
                              return (
                                <div key={r.id} className="flex gap-2">
                                  <Link href={`/profile/${ru}`} onClick={onClose} className="shrink-0 mt-0.5">
                                    <Avatar src={ra} name={ru} size={28} />
                                  </Link>
                                  <div className="flex-1 min-w-0">
                                    <div className="inline-block bg-slate-100 dark:bg-[#3A3B3C] rounded-2xl px-3 py-1.5 max-w-full">
                                      <Link href={`/profile/${ru}`} onClick={onClose} className="font-semibold text-xs text-slate-900 dark:text-[#E4E6EB] hover:underline block">{ru}</Link>
                                      <p className="text-xs text-slate-800 dark:text-[#E4E6EB] break-words">{r.content}</p>
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-[#B0B3B8] px-1">
                                      <span>{formatRelativeTime(r.createdAt)}</span>
                                      <button
                                        onClick={() => likeCommentMutation.mutate({ id: r.id, liked: !!r.isLiked })}
                                        className={`font-semibold ${r.isLiked ? "text-blue-500" : ""}`}
                                      >
                                        Suka {(r._count?.likes ?? 0) > 0 ? `· ${r._count!.likes}` : ""}
                                      </button>
                                      {isOwnReply && (
                                        <button onClick={() => deleteComment(r.id)} className="text-red-500 font-semibold">Hapus</button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Reply input */}
                      <AnimatePresence>
                        {replyFor === c.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 ml-1 flex items-center gap-2 overflow-hidden"
                          >
                            <Avatar src={user?.profile?.profileImageUrl} name={user?.namaLengkap || "U"} size={28} />
                            <div className="flex-1 flex items-center bg-slate-100 dark:bg-[#3A3B3C] rounded-full px-3 py-1.5 gap-2">
                              <input
                                autoFocus
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(c.id); } }}
                                placeholder={`Balas @${cu}…`}
                                className="flex-1 bg-transparent text-xs outline-none dark:text-slate-100 placeholder:text-slate-400"
                              />
                              <button
                                onClick={() => sendReply(c.id)}
                                disabled={sending || !replyText.trim()}
                                className="p-1 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-30 transition-colors"
                              >
                                <Send className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>
            </div>

            {/* Comment input — fixed bottom */}
            <div className="shrink-0 border-t border-slate-200 dark:border-[#3E4042] px-4 py-3 bg-white dark:bg-[#242526]">
              <div className="flex items-center gap-2.5">
                <Avatar src={user?.profile?.profileImageUrl} name={user?.namaLengkap || "U"} size={36} />
                <div className="flex-1 flex items-center bg-slate-100 dark:bg-[#3A3B3C] rounded-full px-4 py-2 gap-2">
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tulis komentar…"
                    className="flex-1 bg-transparent text-sm outline-none dark:text-[#E4E6EB] placeholder:text-slate-400"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                  />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmoji((p) => !p)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                      {showEmoji && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 8 }}
                          className="absolute bottom-10 right-0 z-50 bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3E4042] rounded-2xl shadow-2xl p-3 grid grid-cols-6 gap-2 text-xl"
                        >
                          {EMOJIS.map((e) => (
                            <button
                              key={e}
                              onClick={() => { setText((t) => t + e); setShowEmoji(false); inputRef.current?.focus(); }}
                              className="hover:scale-125 transition-transform"
                            >
                              {e}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <button
                  onClick={sendComment}
                  disabled={sending || !text.trim()}
                  className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-md shadow-blue-500/20"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );

  return createPortal(
    <AnimatePresence>{modalContent}</AnimatePresence>,
    document.body
  );
}

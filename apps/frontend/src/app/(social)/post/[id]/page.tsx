"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, X, UserPlus, LogIn } from "lucide-react";
import Image from "@/components/ui/SmartImage";
import { OptimizedVideoPlayer } from "@/components/OptimizedVideoPlayer";
import { useVideoPlaybackStore } from "@/store/videoPlaybackV2";
import { resolveMediaUrl } from "@/lib/media-url";

interface ImageData { id: string; url: string; }
interface VideoData {
  id: string;
  url: string;
  thumbnail?: string | null;
  originalUrl?: string;
  processedUrl?: string;
  thumbnailUrl?: string | null;
  status?: 'PROCESSING' | 'READY' | 'COMPLETED' | 'FAILED';
  qualityUrls?: Record<string, string> | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}
interface Post {
  id: string;
  content: string;
  title?: string | null;
  type: string;
  images?: ImageData[] | string[] | null;
  videos?: VideoData[] | null;
  video?: VideoData;
  links?: string[] | null;
  tags?: string[] | null;
  hashtags?: string[] | null;
  createdAt: string;
  author?: { id?: string; namaLengkap?: string; profile?: { username: string; profileImageUrl: string | null } };
  user?: { id?: string; username?: string; profile?: { username: string; profileImageUrl: string | null } };
  _count?: { likes: number; comments: number };
}

const normalizeUrl = (url: string | null | undefined) => resolveMediaUrl(url);

export default function PublicPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { activePostId, currentTime, isPlaying } = useVideoPlaybackStore();

  useEffect(() => {
    if (!params.id) return;
    setIsLoading(true);
    apiClient.get(`/posts/${params.id}`)
      .then((r) => setPost(r.data))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg || "Postingan tidak ditemukan");
      })
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const formatRelativeTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const s = Math.floor(diff / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), day = Math.floor(h / 24);
    if (s < 60) return `${s} detik lalu`;
    if (m < 60) return `${m} menit lalu`;
    if (h < 24) return `${h} jam lalu`;
    if (day < 7) return `${day} hari lalu`;
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  if (isLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  if (error || !post) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <X className="w-10 h-10 text-gray-300 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Postingan Tidak Ditemukan</h1>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button onClick={() => router.push("/")} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg">Kembali</button>
      </div>
    </div>
  );

  const username = post.author?.profile?.username || post.user?.profile?.username || post.user?.username || "user";
  const avatarUrl = normalizeUrl(post.author?.profile?.profileImageUrl || post.user?.profile?.profileImageUrl);

  const firstVideo = post.videos?.[0] ?? post.video ?? null;
  const postImageUrl = (() => {
    if (!post.images?.length) return null;
    const img = post.images[0];
    return normalizeUrl(typeof img === 'string' ? img : img.url);
  })();

  const tags = post.hashtags ?? post.tags ?? [];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Kembali</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/login")} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700">
              <LogIn className="w-4 h-4" /> Login
            </button>
            <button onClick={() => router.push("/signup")} className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg">
              <UserPlus className="w-4 h-4" /> Daftar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        <article className="bg-white">
          {/* Author */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative flex-shrink-0">
              {avatarUrl
                ? <Image src={avatarUrl} alt={username} fill sizes="40px" className="object-cover" unoptimized />
                : <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-sm">{username.charAt(0).toUpperCase()}</div>
              }
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{username}</div>
              <div className="text-xs text-gray-500">{formatRelativeTime(post.createdAt)}</div>
            </div>
          </div>

          {/* Media — pakai OptimizedVideoPlayer yang sama dengan feed */}
          {firstVideo ? (
            (() => {
              const w = firstVideo.width;
              const h = firstVideo.height;
              let aspectClass = 'aspect-[9/16]';
              if (w && h) {
                const ratio = w / h;
                if (ratio >= 1.7) aspectClass = 'aspect-video';
                else if (ratio >= 1.2) aspectClass = 'aspect-[4/3]';
                else if (ratio >= 0.9) aspectClass = 'aspect-square';
                else if (ratio >= 0.7) aspectClass = 'aspect-[4/5]';
                else aspectClass = 'aspect-[9/16]';
              }
              const videoFitMode: 'cover' | 'contain' = w && h && (w / h) <= 0.62 ? 'contain' : 'cover';
              return (
                <div className="relative w-full">
                  <OptimizedVideoPlayer
                    postId={post.id}
                    video={{
                      id: firstVideo.id,
                      url: normalizeUrl(firstVideo.url),
                      originalUrl: normalizeUrl(firstVideo.originalUrl),
                      processedUrl: normalizeUrl(firstVideo.processedUrl),
                      thumbnailUrl: normalizeUrl(firstVideo.thumbnailUrl ?? firstVideo.thumbnail),
                      status: firstVideo.status ?? 'READY',
                      qualityUrls: firstVideo.qualityUrls
                        ? Object.fromEntries(
                            Object.entries(firstVideo.qualityUrls).map(([k, v]) => [k, normalizeUrl(v)])
                          ) as VideoData['qualityUrls']
                        : null,
                    }}
                    initialTime={activePostId === post.id ? currentTime : 0}
                    autoResume={activePostId === post.id ? isPlaying : false}
                    fit={videoFitMode}
                    className={`w-full ${aspectClass} max-h-[600px]`}
                    eager
                  />
                  {firstVideo.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-1.5 py-0.5 rounded pointer-events-none">
                      {Math.floor(firstVideo.duration / 60)}:{String(Math.floor(firstVideo.duration % 60)).padStart(2, '0')}
                    </span>
                  )}
                </div>
              );
            })()
          ) : postImageUrl ? (
            <div className="relative w-full bg-gray-100">
              <Image src={postImageUrl} alt="Post" width={1200} height={1200} className="w-full h-auto object-cover max-h-[600px]" priority unoptimized />
            </div>
          ) : null}

          {/* Actions */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowLoginPrompt(true)} className="flex items-center gap-1.5 text-gray-700 hover:text-red-500 transition-colors">
                <Heart className="w-6 h-6" />
                <span className="text-sm font-medium">{post._count?.likes || 0}</span>
              </button>
              <button onClick={() => setShowLoginPrompt(true)} className="flex items-center gap-1.5 text-gray-700 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm font-medium">{post._count?.comments || 0}</span>
              </button>
              <button onClick={() => setShowLoginPrompt(true)} className="text-gray-700 hover:text-gray-900 transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
            <button onClick={() => setShowLoginPrompt(true)} className="text-gray-700 hover:text-gray-900 transition-colors">
              <Bookmark className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            {post.title && <h1 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h1>}
            {post.content && (
              <div className="text-gray-800 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
            )}
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="text-blue-600 text-sm font-medium hover:underline cursor-pointer">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-center text-gray-600 text-sm mb-3">Login untuk berinteraksi dengan postingan ini</p>
            <div className="flex gap-3">
              <button onClick={() => router.push("/login")} className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors">Login</button>
              <button onClick={() => router.push("/signup")} className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">Join the Circle</button>
            </div>
          </div>
        </article>
      </main>

      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" onClick={() => setShowLoginPrompt(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <LogIn className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Login Diperlukan</h3>
              <p className="text-gray-500 text-sm">Untuk berinteraksi, silakan login atau daftar akun.</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => router.push("/signup")} className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg">Join the Circle</button>
              <button onClick={() => router.push("/login")} className="w-full py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg">Login</button>
              <button onClick={() => setShowLoginPrompt(false)} className="w-full py-2 text-gray-500 text-sm">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

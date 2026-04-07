"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, X, UserPlus, LogIn, Play } from "lucide-react";
import Image from "next/image";

interface ImageData {
    id: string;
    url: string;
}

interface VideoData {
    id: string;
    url: string;
    thumbnail?: string | null;
    originalUrl?: string;
    processedUrl?: string;
    thumbnailUrl?: string;
    status?: 'PROCESSING' | 'READY' | 'COMPLETED' | 'FAILED';
    qualityUrls?: Record<string, string>;
}

interface Post {
    id: string;
    content: string;
    title?: string | null;
    type: string;
    images?: ImageData[] | string[] | null;
    videos?: VideoData[] | null;
    links?: string[] | null;
    tags?: string[] | null;
    hashtags?: string[] | null;
    videoId?: string | null;
    video?: VideoData;
    createdAt: string;
    author?: {
        id?: string;
        namaLengkap?: string;
        profile?: {
            username: string;
            profileImageUrl: string | null;
        };
    };
    user?: {
        id?: string;
        username?: string;
        profile?: {
            username: string;
            profileImageUrl: string | null;
        };
    };
    _count?: {
        likes: number;
        comments: number;
    };
}

const ASSET_BASE_URL =
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";

const normalizeUrl = (url: string | null | undefined): string | null => {
    if (!url || url.trim() === "") return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ASSET_BASE_URL}${url}`;
    return `${ASSET_BASE_URL}/${url}`;
};

export default function PublicPostPage() {
    const params = useParams();
    const router = useRouter();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setIsLoading(true);
                const response = await apiClient.get(`/posts/${params.id}`);
                setPost(response.data);
            } catch (err: unknown) {
                console.error("Error fetching post:", err);
                const errorMessage = err && typeof err === 'object' && 'response' in err 
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message 
                    : null;
                setError(errorMessage || "Postingan tidak ditemukan");
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchPost();
        }
    }, [params.id]);

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return `${diffSecs} detik lalu`;
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Memuat postingan...</p>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-gray-400" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Postingan Tidak Ditemukan</h1>
                    <p className="text-gray-500 text-sm mb-6">{error || "Postingan yang Anda cari tidak tersedia."}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
        );
    }

    const username = post?.author?.profile?.username || post?.user?.profile?.username || post?.user?.username || "user";
    const avatarUrl = normalizeUrl(post?.author?.profile?.profileImageUrl || post?.user?.profile?.profileImageUrl);
    
    // Get best available image URL - handle both string[] and ImageData[]
    const getPostImageUrl = (): string | null => {
        if (post?.images && post.images.length > 0) {
            const firstImage = post.images[0];
            // Handle object format {id, url}
            if (typeof firstImage === 'object' && firstImage !== null && 'url' in firstImage) {
                return normalizeUrl(firstImage.url);
            }
            // Handle string format
            if (typeof firstImage === 'string' && firstImage.trim() !== "") {
                return normalizeUrl(firstImage);
            }
        }
        return null;
    };
    
    // Get best available video URL - handle both video and videos array
    const getVideoUrl = (): string | null => {
        // Check videos array first (from backend response)
        if (post?.videos && post.videos.length > 0) {
            const firstVideo = post.videos[0];
            return normalizeUrl(firstVideo.url || firstVideo.processedUrl || firstVideo.originalUrl);
        }
        // Check single video object
        if (post?.video) {
            return normalizeUrl(post.video.processedUrl || post.video.url || post.video.originalUrl);
        }
        return null;
    };
    
    // Get video thumbnail
    const getVideoThumbnail = (): string | null => {
        if (post?.videos && post.videos.length > 0) {
            return normalizeUrl(post.videos[0].thumbnail || post.videos[0].thumbnailUrl);
        }
        if (post?.video) {
            return normalizeUrl(post.video.thumbnail || post.video.thumbnailUrl);
        }
        return null;
    };
    
    // Get tags/hashtags
    const getTags = (): string[] => {
        if (post?.hashtags && Array.isArray(post.hashtags)) {
            return post.hashtags;
        }
        if (post?.tags && Array.isArray(post.tags)) {
            return post.tags;
        }
        return [];
    };
    
    const postImageUrl = getPostImageUrl();
    const videoUrl = getVideoUrl();
    const thumbnailUrl = getVideoThumbnail();
    const tags = getTags();
    const hasMedia = postImageUrl || videoUrl;

    return (
        <div className="min-h-screen bg-white">
            {/* Clean Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Kembali</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push("/login")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <LogIn className="w-4 h-4" />
                            Login
                        </button>
                        <button
                            onClick={() => router.push("/signup")}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Daftar
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content - Single Column Centered */}
            <main className="max-w-2xl mx-auto">
                <article className="bg-white">
                    {/* Author Header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden relative flex-shrink-0">
                            {avatarUrl ? (
                                <Image 
                                    src={avatarUrl} 
                                    alt={username} 
                                    fill 
                                    sizes="40px" 
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-sm">
                                    {username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm truncate">{username}</div>
                            <div className="text-xs text-gray-500">{formatRelativeTime(post.createdAt)}</div>
                        </div>
                    </div>

                    {/* Media */}
                    {hasMedia && (
                        <div className="relative w-full bg-gray-100">
                            {videoUrl ? (
                                <div className="relative w-full aspect-video bg-slate-900">
                                    <video
                                        src={videoUrl}
                                        poster={thumbnailUrl || undefined}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        className="w-full h-full object-contain"
                                    >
                                        Browser Anda tidak mendukung video.
                                    </video>
                                    {!thumbnailUrl && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gray-900/20">
                                            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                                                <Play className="w-8 h-8 text-gray-800 ml-1" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : postImageUrl ? (
                                <div className="relative w-full">
                                    <Image
                                        src={postImageUrl}
                                        alt="Post content"
                                        width={1200}
                                        height={1200}
                                        className="w-full h-auto object-cover max-h-[600px]"
                                        priority
                                        unoptimized
                                    />
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setShowLoginPrompt(true)}
                                className="flex items-center gap-1.5 text-gray-700 hover:text-red-500 transition-colors"
                            >
                                <Heart className="w-6 h-6" />
                                <span className="text-sm font-medium">{post._count?.likes || 0}</span>
                            </button>
                            <button 
                                onClick={() => setShowLoginPrompt(true)}
                                className="flex items-center gap-1.5 text-gray-700 hover:text-blue-500 transition-colors"
                            >
                                <MessageCircle className="w-6 h-6" />
                                <span className="text-sm font-medium">{post._count?.comments || 0}</span>
                            </button>
                            <button 
                                onClick={() => setShowLoginPrompt(true)}
                                className="text-gray-700 hover:text-gray-900 transition-colors"
                            >
                                <Share2 className="w-6 h-6" />
                            </button>
                        </div>
                        <button 
                            onClick={() => setShowLoginPrompt(true)}
                            className="text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <Bookmark className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-4 py-3">
                        {post.title && (
                            <h1 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h1>
                        )}
                        {post.content && (
                            <div 
                                className="text-gray-800 text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                        )}
                        {tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {tags.map((tag) => (
                                    <span key={tag} className="text-blue-600 text-sm font-medium hover:underline cursor-pointer">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CTA Section */}
                    <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                        <p className="text-center text-gray-600 text-sm mb-3">
                            Login untuk berinteraksi dengan postingan ini
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push("/login")}
                                className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => router.push("/signup")}
                                className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Join the Circle
                            </button>
                        </div>
                    </div>
                </article>
            </main>

            {/* Login Prompt Modal */}
            {showLoginPrompt && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
                    onClick={() => setShowLoginPrompt(false)}
                >
                    <div 
                        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-5">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                <LogIn className="w-6 h-6 text-gray-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Login Diperlukan</h3>
                            <p className="text-gray-500 text-sm">
                                Untuk berinteraksi dengan postingan ini, silakan Login atau daftar akun.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => router.push("/signup")}
                                className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Join the Circle
                            </button>
                            <button
                                onClick={() => router.push("/login")}
                                className="w-full py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setShowLoginPrompt(false)}
                                className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

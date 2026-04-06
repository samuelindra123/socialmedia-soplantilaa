"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import useAuthStore from "@/store/auth";
import toast from "react-hot-toast";

interface StoryUser {
  id: string;
  namaLengkap: string;
  profile?: {
    username: string;
    profileImageUrl: string | null;
  };
}

interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
  caption?: string;
  type: "IMAGE" | "VIDEO";
  createdAt: string;
  expiresAt: string;
  isSeen: boolean;
}

interface StoryGroup {
  user: StoryUser;
  stories: Story[];
  hasUnseen: boolean;
}

interface StoryViewerProps {
  groups: StoryGroup[];
  startGroupIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds for images
const VIDEO_MAX_DURATION = 30000; // 30 seconds max for video stories
const PROGRESS_UPDATE_INTERVAL = 16; // ~60fps for smooth animation

// Normalize media URL - improved version
const normalizeMediaUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  
  // Already absolute URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  
  // Protocol-relative URL
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  
  // Relative URL
  if (trimmed.startsWith("/")) {
    const baseUrl =
      process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:4000";
    return `${baseUrl}${trimmed}`;
  }
  
  // Assume it needs https
  return `https://${trimmed}`;
};

export default function StoryViewer({
  groups,
  startGroupIndex,
  onClose,
}: StoryViewerProps) {
  const { user } = useAuthStore();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(startGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [hasMediaError, setHasMediaError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(0);
  const pausedProgress = useRef<number>(0);

  const currentGroup = groups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwnStory = currentGroup?.user.id === user?.id;

  // Mark story as viewed
  const markAsViewed = useCallback(async (storyId: string) => {
    try {
      await apiClient.post(`/stories/${storyId}/view`);
    } catch (error) {
      // Ignore errors
    }
  }, []);

  // Go to next story
  const goNext = useCallback(() => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentStoryIndex, currentGroup?.stories.length, currentGroupIndex, groups.length, onClose]);

  // Go to previous story
  const goPrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex((prev) => prev - 1);
      const prevGroup = groups[currentGroupIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [currentStoryIndex, currentGroupIndex, groups]);

  // Start progress timer - smoother animation using requestAnimationFrame
  const startProgress = useCallback((duration: number, initialProgress = 0) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    const remainingDuration = duration * (1 - initialProgress);
    startTime.current = Date.now();
    pausedProgress.current = initialProgress;

    // Use a more frequent interval for smoother animation
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const progressIncrement = elapsed / duration;
      const newProgress = Math.min(1, pausedProgress.current + progressIncrement);
      
      if (newProgress >= 1) {
        setProgress(1);
        clearInterval(progressInterval.current!);
        // Small delay before moving to next to ensure the bar completes visually
        setTimeout(() => goNext(), 50);
      } else {
        setProgress(newProgress);
      }
    }, PROGRESS_UPDATE_INTERVAL);
  }, [goNext]);

  // Pause progress
  const pauseProgress = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      pausedProgress.current = progress;
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPaused(true);
  }, [progress]);

  // Resume progress
  const resumeProgress = useCallback(() => {
    setIsPaused(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
    
    if (currentStory?.type === "IMAGE") {
      startProgress(STORY_DURATION, pausedProgress.current);
    }
  }, [currentStory?.type, startProgress]);

  // Handle video events
  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current && !isPaused) {
      let duration = videoRef.current.duration * 1000;
      // Cap video duration to VIDEO_MAX_DURATION
      if (duration > VIDEO_MAX_DURATION) {
        duration = VIDEO_MAX_DURATION;
      }
      startProgress(duration);
      videoRef.current.play().catch(() => {
        // Autoplay blocked - pause the video
        setIsPaused(true);
      });
    }
  }, [isPaused, startProgress]);

  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const currentTime = videoRef.current.currentTime;
      setProgress(currentTime / duration);
      
      // Auto-skip at VIDEO_MAX_DURATION
      if (currentTime * 1000 >= VIDEO_MAX_DURATION) {
        goNext();
      }
    }
  }, [goNext]);

  const handleVideoEnded = useCallback(() => {
    goNext();
  }, [goNext]);

  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error("Video error:", e);
    setIsMediaLoading(false);
    setHasMediaError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setHasMediaError(false);
    setIsMediaLoading(true);
    setRetryCount(prev => prev + 1);
    
    // Force reload video
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  // Mark story as viewed when displayed
  useEffect(() => {
    if (currentStory && !currentStory.isSeen && !isOwnStory) {
      markAsViewed(currentStory.id);
    }
  }, [currentStory, isOwnStory, markAsViewed]);

  // Reset error state when story changes
  useEffect(() => {
    setHasMediaError(false);
    setRetryCount(0);
    setIsMediaLoading(true);
    setIsBuffering(false);
  }, [currentStory?.id]);

  // Start progress for images - only after loaded
  useEffect(() => {
    if (currentStory?.type === "IMAGE" && !isPaused && !hasMediaError && !isMediaLoading) {
      setProgress(0);
      pausedProgress.current = 0;
      startProgress(STORY_DURATION);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentStory?.id, currentStory?.type, isPaused, startProgress, hasMediaError, isMediaLoading]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          goPrev();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "Escape":
          onClose();
          break;
        case " ":
          e.preventDefault();
          if (isPaused) {
            resumeProgress();
          } else {
            pauseProgress();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, onClose, isPaused, pauseProgress, resumeProgress]);

  // Delete story
  const handleDeleteStory = async () => {
    if (!currentStory) return;
    
    try {
      await apiClient.delete(`/stories/${currentStory.id}`);
      toast.success("Story dihapus");
      
      // If this was the last story in the group
      if (currentGroup.stories.length === 1) {
        if (groups.length === 1) {
          onClose();
        } else {
          goNext();
        }
      } else {
        goNext();
      }
    } catch (error) {
      toast.error("Gagal menghapus story");
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins}m lalu`;
    return `${diffHours}j lalu`;
  };

  if (!currentGroup || !currentStory) return null;

  // For video: use previewUrl first (instant load), fallback to mediaUrl
  const videoUrl = currentStory.type === "VIDEO"
    ? normalizeMediaUrl(currentStory.previewUrl) || normalizeMediaUrl(currentStory.mediaUrl)
    : "";
  const mediaUrl = normalizeMediaUrl(currentStory.mediaUrl);

  return (
    <div className="fixed inset-0 z-[200] bg-black overflow-y-auto">
      {/* Full screen container */}
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4">
        {/* Close button - fixed position */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-[210] p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Navigation buttons - hidden on mobile, show on desktop */}
        {(currentGroupIndex > 0 || currentStoryIndex > 0) && (
          <button
            onClick={goPrev}
            className="hidden sm:flex fixed left-4 top-1/2 -translate-y-1/2 z-[210] p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {(currentGroupIndex < groups.length - 1 ||
          currentStoryIndex < currentGroup.stories.length - 1) && (
          <button
            onClick={goNext}
            className="hidden sm:flex fixed right-4 top-1/2 -translate-y-1/2 z-[210] p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors items-center justify-center"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Story container - responsive */}
        <div className="relative w-full sm:w-auto sm:max-w-md h-[100dvh] sm:h-[90vh] bg-black sm:rounded-2xl overflow-hidden">
          {/* Progress bars - smoother animation */}
          <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-3 pt-4 safe-area-inset-top">
            {currentGroup.stories.map((story, index) => (
              <div
                key={story.id}
                className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full"
                  style={{
                    width:
                      index < currentStoryIndex
                        ? "100%"
                        : index === currentStoryIndex
                        ? `${progress * 100}%`
                        : "0%",
                    transition: index === currentStoryIndex 
                      ? "width 16ms linear" 
                      : "width 200ms ease-out",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-0 right-0 z-30 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
                {currentGroup.user.profile?.profileImageUrl ? (
                  <img
                    src={normalizeMediaUrl(currentGroup.user.profile.profileImageUrl)}
                    alt={currentGroup.user.profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {currentGroup.user.profile?.username?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {currentGroup.user.profile?.username || "user"}
                </p>
                <p className="text-white/70 text-xs">
                  {formatTimeAgo(currentStory.createdAt)}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Pause/Play */}
              <button
                onClick={() => (isPaused ? resumeProgress() : pauseProgress())}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPaused ? (
                  <Play className="w-5 h-5 text-white" />
                ) : (
                  <Pause className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Mute (for videos) */}
              {currentStory.type === "VIDEO" && (
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted;
                    }
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
              )}

              {/* Delete (for own stories) */}
              {isOwnStory && (
                <button
                  onClick={handleDeleteStory}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Buffering indicator - minimal like feed */}
          {isBuffering && currentStory.type === "VIDEO" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
              <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Error state */}
          {hasMediaError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 gap-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-white/80 text-sm text-center px-4">
                Gagal memuat {currentStory.type === "VIDEO" ? "video" : "gambar"}
              </p>
              {retryCount < 3 && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">Coba lagi</span>
                </button>
              )}
              <button
                onClick={goNext}
                className="text-white/60 text-sm hover:text-white transition-colors"
              >
                Lewati
              </button>
            </div>
          )}

          {/* Media */}
          <div
            className="w-full h-full flex items-center justify-center"
            onClick={(e) => {
              if (hasMediaError) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const width = rect.width;

              if (clickX < width / 3) {
                goPrev();
              } else if (clickX > (width * 2) / 3) {
                goNext();
              } else {
                if (isPaused) {
                  resumeProgress();
                } else {
                  pauseProgress();
                }
              }
            }}
            onMouseDown={() => !hasMediaError && pauseProgress()}
            onMouseUp={() => !hasMediaError && resumeProgress()}
            onTouchStart={() => !hasMediaError && pauseProgress()}
            onTouchEnd={() => !hasMediaError && resumeProgress()}
          >
            {currentStory.type === "VIDEO" ? (
              videoUrl ? (
                <video
                  key={`${currentStory.id}-${retryCount}`}
                  ref={videoRef}
                  src={videoUrl}
                  poster={currentStory.thumbnailUrl ? normalizeMediaUrl(currentStory.thumbnailUrl) : undefined}
                  className="w-full h-full object-contain"
                  playsInline
                  muted={isMuted}
                  preload="metadata"
                  onLoadedMetadata={() => {
                    setIsMediaLoading(false);
                    setHasMediaError(false);
                    handleVideoLoaded();
                  }}
                  onCanPlay={() => {
                    setIsMediaLoading(false);
                    setHasMediaError(false);
                    setIsBuffering(false);
                  }}
                  onWaiting={() => {
                    setIsBuffering(true);
                  }}
                  onPlaying={() => {
                    setIsBuffering(false);
                  }}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                  onError={handleVideoError}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <AlertCircle className="w-12 h-12 text-red-400" />
                </div>
              )
            ) : (
              mediaUrl ? (
                <>
                  {/* Loading placeholder for images */}
                  {isMediaLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-white/60 text-xs">Memuat gambar...</span>
                      </div>
                    </div>
                  )}
                  <img
                    key={`${currentStory.id}-${retryCount}`}
                    src={mediaUrl}
                    alt="Story"
                    className={`w-full h-full object-contain ${isMediaLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                    onLoad={() => {
                      setIsMediaLoading(false);
                      setHasMediaError(false);
                    }}
                    onError={() => {
                      setIsMediaLoading(false);
                      setHasMediaError(true);
                    }}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <AlertCircle className="w-12 h-12 text-red-400" />
                </div>
              )
            )}
          </div>

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent safe-area-inset-bottom">
              <p className="text-white text-sm leading-relaxed">{currentStory.caption}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 🎬 VideoPlayer Component - Instagram Reels Style
 * Single video element yang di-share antara Feed dan Modal
 * 
 * Features:
 * - Autoplay dengan IntersectionObserver
 * - Sinkronisasi state global via Zustand
 * - Tidak ada ghost video
 * - Controls yang konsisten
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useVideoStore } from '@/store/videoPlayback';

// Normalize URL helper
const normalizeVideoUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.includes('.') && !trimmed.startsWith('/')) return `https://${trimmed}`;
  return '';
};

export interface VideoQuality {
  '144p'?: string;
  '240p'?: string;
  '360p'?: string;
  '480p'?: string;
  '720p'?: string;
}

export interface VideoData {
  id: string;
  url?: string;
  originalUrl?: string;
  processedUrl?: string;
  thumbnailUrl?: string | null;
  qualityUrls?: VideoQuality | null;
  status?: 'PROCESSING' | 'READY' | 'COMPLETED' | 'FAILED';
}

interface VideoPlayerProps {
  video: VideoData;
  postId: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  showQualityBadge?: boolean;
  showProcessingStatus?: boolean;
  isInModal?: boolean;
  onOpenModal?: () => void;
}

export function VideoPlayer({
  video,
  postId,
  autoPlay = true,
  muted: initialMuted = true,
  loop = true,
  className = '',
  showQualityBadge = true,
  showProcessingStatus = true,
  isInModal = false,
  onOpenModal,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('original');

  // Zustand store
  const {
    activeVideoId,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    progress,
    showControls,
    isModalOpen,
    setActiveVideo,
    setVideoElement,
    play,
    pause,
    togglePlay,
    toggleMute,
    updateTime,
    updateDuration,
    setShowControls,
    seekByPercent,
  } = useVideoStore();

  // Check if this video is active
  const isActiveVideo = activeVideoId === postId;
  const shouldShowVideo = isInModal ? isModalOpen : !isModalOpen;

  // Get best video URL
  const getVideoUrl = useCallback(() => {
    let url: string | null = null;
    let quality = 'original';

    if (video.qualityUrls) {
      const qualities = ['720p', '480p', '360p', '240p', '144p'] as const;
      for (const q of qualities) {
        if (video.qualityUrls[q]) {
          url = normalizeVideoUrl(video.qualityUrls[q]);
          if (url) {
            quality = q;
            break;
          }
        }
      }
    }

    if (!url) {
      url = normalizeVideoUrl(video.processedUrl || video.originalUrl || video.url);
      quality = video.processedUrl ? 'processed' : 'original';
    }

    return { url, quality };
  }, [video]);

  const { url: videoUrl, quality } = getVideoUrl();

  // Update quality state
  useEffect(() => {
    setCurrentQuality(quality);
  }, [quality]);

  // IntersectionObserver for autoplay
  useEffect(() => {
    if (isInModal) return; // Don't use observer in modal

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
          setIsVisible(visible);

          if (visible && autoPlay && !isModalOpen) {
            // This video is now in view
            setActiveVideo(postId);
          } else if (!visible && isActiveVideo && !isModalOpen) {
            // This video left view
            pause();
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '-10% 0px -10% 0px',
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [postId, autoPlay, isActiveVideo, isModalOpen, setActiveVideo, pause, isInModal]);

  // Register video element when active
  useEffect(() => {
    if (isActiveVideo && videoRef.current && shouldShowVideo) {
      setVideoElement(videoRef.current);
      
      // Auto-play if visible and autoPlay is enabled
      if (isVisible && autoPlay && !isModalOpen) {
        play();
      }
    }
  }, [isActiveVideo, shouldShowVideo, isVisible, autoPlay, isModalOpen, setVideoElement, play]);

  // Sync muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle video events
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && isActiveVideo) {
      updateTime(videoRef.current.currentTime);
    }
  }, [isActiveVideo, updateTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current && isActiveVideo) {
      updateDuration(videoRef.current.duration);
    }
  }, [isActiveVideo, updateDuration]);

  const handlePlay = useCallback(() => {
    if (isActiveVideo) {
      useVideoStore.setState({ isPlaying: true });
    }
  }, [isActiveVideo]);

  const handlePause = useCallback(() => {
    if (isActiveVideo) {
      useVideoStore.setState({ isPlaying: false, showControls: true });
    }
  }, [isActiveVideo]);

  const handleEnded = useCallback(() => {
    if (isActiveVideo && !loop) {
      useVideoStore.setState({ isPlaying: false, showControls: true });
    }
  }, [isActiveVideo, loop]);

  // Controls visibility
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, setShowControls]);

  // Handle click on video
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isActiveVideo) {
      setActiveVideo(postId);
      return;
    }
    
    togglePlay();
    showControlsTemporarily();
  }, [isActiveVideo, postId, setActiveVideo, togglePlay, showControlsTemporarily]);

  // Handle progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    seekByPercent(percent);
  }, [seekByPercent]);

  // Format time
  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render video if not active or in wrong context
  if (!videoUrl) {
    return (
      <div className={`relative bg-black flex items-center justify-center ${className}`}>
        <div className="text-white text-sm">Video tidak tersedia</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black group ${className}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={video.thumbnailUrl ? normalizeVideoUrl(video.thumbnailUrl) : undefined}
        className="w-full h-full object-contain"
        muted={isMuted}
        loop={loop}
        playsInline
        preload="metadata"
        onClick={handleVideoClick}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      />

      {/* Center Play Button */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={handleVideoClick}
      >
        {(!isPlaying || !isActiveVideo) && (
          <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border-2 border-white/30 hover:bg-black/60 transition-all hover:scale-110 shadow-2xl">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-4 px-4 transition-opacity duration-300 ${
          (showControls || !isPlaying || !isActiveVideo) ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div
          className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer hover:h-2 transition-all group/progress"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-white rounded-full relative transition-all"
            style={{ width: `${isActiveVideo ? progress : 0}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isActiveVideo) {
                  setActiveVideo(postId);
                } else {
                  togglePlay();
                }
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isPlaying && isActiveVideo ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white fill-white" />
              )}
            </button>

            {/* Mute */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Time */}
            <span className="text-xs text-white ml-2 tabular-nums">
              {formatTime(isActiveVideo ? currentTime : 0)} / {formatTime(isActiveVideo ? duration : 0)}
            </span>
          </div>

          {/* Quality Badge */}
          {showQualityBadge && (
            <div className="bg-black/60 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full" />
              {currentQuality.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Processing Badge */}
      {showProcessingStatus && video.status === 'PROCESSING' && (
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          Processing...
        </div>
      )}

      {/* HD Ready Badge */}
      {showQualityBadge && video.status === 'COMPLETED' && (
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full" />
          HD Ready
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;

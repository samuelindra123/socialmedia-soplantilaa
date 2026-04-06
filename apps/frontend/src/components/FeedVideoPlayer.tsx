/**
 * 🎬 FeedVideoPlayer - Instagram Style Video Player
 * 
 * KONSEP:
 * - Hanya ada SATU video element per post
 * - Video element ini yang di-share ke modal (bukan duplikasi)
 * - Autoplay saat visible, pause saat tidak visible
 * - State di-manage oleh Zustand store
 */

'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useVideoPlaybackStore, useActiveVideo, useVideoControls } from '@/store/videoPlaybackV2';

// URL normalizer
const normalizeUrl = (url: string | null | undefined): string => {
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

interface FeedVideoPlayerProps {
  postId: string;
  video: VideoData;
  className?: string;
}

function FeedVideoPlayerComponent({ postId, video, className = '' }: FeedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Store state
  const { 
    activePostId, 
    isPlaying, 
    isMuted, 
    progress, 
    currentTime, 
    duration,
    showControls,
    isBuffering,
    isModalOpen,
  } = useActiveVideo();
  
  const { 
    togglePlayPause, 
    toggleMute, 
    seekPercent,
    showControlsTemporarily,
  } = useVideoControls();
  
  const store = useVideoPlaybackStore;
  
  const isThisVideoActive = activePostId === postId;
  
  // Get best video URL
  const getVideoUrl = useCallback(() => {
    if (video.qualityUrls) {
      const qualities = ['720p', '480p', '360p', '240p', '144p'] as const;
      for (const q of qualities) {
        const url = normalizeUrl(video.qualityUrls[q]);
        if (url) return url;
      }
    }
    return normalizeUrl(video.processedUrl || video.originalUrl || video.url);
  }, [video]);
  
  const videoUrl = getVideoUrl();
  
  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || !isThisVideoActive) return;
    const time = Number.isFinite(el.currentTime) ? el.currentTime : 0;
    const dur = Number.isFinite(el.duration) ? el.duration : 0;
    store.getState().onTimeUpdate(time, dur);
  }, [isThisVideoActive]);
  
  const handlePlay = useCallback(() => {
    if (isThisVideoActive) {
      store.getState().onPlay();
    }
  }, [isThisVideoActive]);
  
  const handlePause = useCallback(() => {
    if (isThisVideoActive) {
      store.getState().onPause();
    }
  }, [isThisVideoActive]);
  
  const handleEnded = useCallback(() => {
    if (isThisVideoActive) {
      store.getState().onEnded();
    }
  }, [isThisVideoActive]);
  
  const handleWaiting = useCallback(() => {
    if (isThisVideoActive) {
      store.getState().onWaiting();
    }
  }, [isThisVideoActive]);
  
  const handleCanPlay = useCallback(() => {
    if (isThisVideoActive) {
      store.getState().onCanPlay();
    }
  }, [isThisVideoActive]);
  
  // IntersectionObserver untuk autoplay dengan debounce
  useEffect(() => {
    const container = containerRef.current;
    const videoEl = videoRef.current;
    if (!container || !videoEl || !videoUrl) return;
    
    let visibilityTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastVisibleState = false;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Lebih toleran: visible jika 50% atau lebih terlihat
          const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
          
          // Debounce visibility changes untuk mencegah flickering
          if (isVisible !== lastVisibleState) {
            if (visibilityTimeout) {
              clearTimeout(visibilityTimeout);
            }
            
            visibilityTimeout = setTimeout(() => {
              lastVisibleState = isVisible;
              store.getState().setVideoVisible(postId, isVisible);
              
              if (isVisible) {
                // Register sebagai video aktif dan play
                store.getState().registerVideo(postId, videoEl, videoUrl);
                
                // Autoplay jika belum playing dan modal tidak terbuka
                if (!store.getState().isModalOpen) {
                  store.getState().play();
                }
              }
            }, isVisible ? 100 : 300); // Cepat untuk play, lambat untuk pause
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '-10% 0px -10% 0px',
      }
    );
    
    observerRef.current.observe(container);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
    };
  }, [postId, videoUrl]);
  
  // Sync muted state ke video element
  useEffect(() => {
    if (videoRef.current && isThisVideoActive) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, isThisVideoActive]);
  
  // Handle click on video
  const handleVideoClick = useCallback(() => {
    if (!isThisVideoActive) {
      // Aktifkan video ini dulu
      if (videoRef.current) {
        store.getState().registerVideo(postId, videoRef.current, videoUrl);
      }
    }
    togglePlayPause();
  }, [isThisVideoActive, postId, videoUrl, togglePlayPause]);
  
  // Handle progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isThisVideoActive) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    seekPercent(percent);
  }, [isThisVideoActive, seekPercent]);
  
  // Handle mute click
  const handleMuteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  }, [toggleMute]);
  
  // Format time
  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!videoUrl) {
    return (
      <div className={`relative bg-black flex items-center justify-center ${className}`}>
        <span className="text-white/60 text-sm">Video tidak tersedia</span>
      </div>
    );
  }
  
  const shouldShowControls = isThisVideoActive ? showControls : true;
  const displayProgress = isThisVideoActive ? progress : 0;
  const displayTime = isThisVideoActive ? currentTime : 0;
  const displayDuration = isThisVideoActive ? duration : (videoRef.current?.duration ?? 0);
  const displayPlaying = isThisVideoActive ? isPlaying : false;
  const displayBuffering = isThisVideoActive ? isBuffering : false;
  
  return (
    <div
      ref={containerRef}
      className={`relative bg-black group ${className}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => displayPlaying && store.getState().hideControls()}
    >
      {/* Video Element - Satu-satunya video element untuk post ini */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={video.thumbnailUrl ? normalizeUrl(video.thumbnailUrl) : undefined}
        className="w-full h-full object-contain"
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        onClick={handleVideoClick}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
      />
      
      {/* Buffering Indicator */}
      {displayBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}
      
      {/* Center Play Button - Show when paused */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={handleVideoClick}
      >
        {!displayPlaying && !displayBuffering && (
          <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 hover:bg-black/70 transition-all hover:scale-110 shadow-2xl">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        )}
      </div>
      
      {/* Bottom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-4 px-4 transition-opacity duration-300 ${
          shouldShowControls || !displayPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div
          className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer hover:h-2 transition-all group/progress"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-white rounded-full relative transition-all"
            style={{ width: `${displayProgress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
          </div>
        </div>
        
        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={(e) => { e.stopPropagation(); handleVideoClick(); }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {displayPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white fill-white" />
              )}
            </button>
            
            {/* Mute/Unmute */}
            <button
              onClick={handleMuteClick}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
            
            {/* Time Display */}
            <span className="text-xs text-white/90 tabular-nums ml-1">
              {formatTime(displayTime)} / {formatTime(displayDuration)}
            </span>
          </div>
          
          {/* Quality Badge */}
          <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            {video.status === 'PROCESSING' ? 'Processing' : 'HD'}
          </div>
        </div>
      </div>
      
      {/* Processing Indicator */}
      {video.status === 'PROCESSING' && (
        <div className="absolute top-3 right-3 bg-yellow-500/90 text-black text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing
        </div>
      )}
    </div>
  );
}

export const FeedVideoPlayer = memo(FeedVideoPlayerComponent);
export default FeedVideoPlayer;

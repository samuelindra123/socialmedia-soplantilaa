/**
 * 🎬 InstantVideoPlayer Component - TikTok/Instagram Style
 * Video player yang benar-benar bisa diplay dengan event handlers yang proper
 */

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

// Import untuk video playback sync
import { useVideoPlaybackSync } from '@/hooks/useVideoPlaybackSync';

const normalizeVideoUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  
  if (trimmed.includes('.') && !trimmed.startsWith('/')) {
    return `https://${trimmed}`;
  }
  
  return '';
};

interface VideoQuality {
  '144p'?: string;
  '240p'?: string;
  '360p'?: string;
  '480p'?: string;
  '720p'?: string;
}

interface Video {
  id: string;
  originalUrl: string | null;
  processedUrl: string | null;
  qualityUrls: VideoQuality | null;
  thumbnailUrl: string | null;
  status: 'PROCESSING' | 'READY' | 'COMPLETED' | 'FAILED';
}

interface InstantVideoPlayerProps {
  video: Video;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  showQualityBadge?: boolean;
  showProcessingStatus?: boolean;
  onQualityChange?: (quality: string) => void;
  videoRef?: React.Ref<HTMLVideoElement>;
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function InstantVideoPlayer({
  video,
  autoPlay = false,
  muted: initialMuted = true,
  loop = false,
  className = '',
  showQualityBadge = true,
  showProcessingStatus = true,
  onQualityChange,
  videoRef: externalRef,
  onModalOpen,
  onModalClose,
}: InstantVideoPlayerProps) {
  // Local state untuk video element
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalRef ? (externalRef as React.MutableRefObject<HTMLVideoElement | null>) : internalRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentQuality, setCurrentQuality] = useState('original');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Initialize URL
  useEffect(() => {
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
      url = normalizeVideoUrl(video.processedUrl || video.originalUrl);
    }
    
    if (url && url !== currentVideoUrl) {
      console.log(`🎬 Video URL: ${url.substring(0, 60)}...`);
      setCurrentVideoUrl(url);
      setCurrentQuality(quality);
    }
  }, [video.originalUrl, video.processedUrl, video.qualityUrls]);

  // Intersection Observer - Autoplay saat video masuk viewport, stop saat keluar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Video masuk viewport - autoplay
          setIsVisible(true);
          if (videoRef.current && currentVideoUrl) {
            videoRef.current.play().catch(err => console.log('Auto-play prevented:', err));
          }
        } else {
          // Video keluar viewport - pause
          setIsVisible(false);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      {
        threshold: 0.5, // Trigger ketika 50% video terlihat
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [currentVideoUrl]);

  // PLAY/PAUSE - MOST IMPORTANT
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    try {
      if (videoRef.current.paused) {
        console.log('▶️ Playing...');
        videoRef.current.play().catch(err => console.error('Play error:', err));
      } else {
        console.log('⏸️ Pausing...');
        videoRef.current.pause();
      }
    } catch (error) {
      console.error('Play/Pause error:', error);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      console.log(`✅ Duration: ${videoRef.current.duration}s`);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setVideoProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && videoRef.current.duration) {
      const newTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.currentTime + 10,
        videoRef.current.duration
      );
    }
  };

  const handleSkipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    // Get video element dimensions
    const video = videoRef.current;
    if (!video) return;

    const rect = video.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const centerX = rect.width / 2;

    // Left click = backward 10s, Right click = forward 10s
    if (clickX < centerX) {
      handleSkipBackward();
    } else {
      handleSkipForward();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center overflow-hidden group ${className}`}>
      {/* VIDEO ELEMENT */}
      {currentVideoUrl && (
        <video
          ref={videoRef}
          src={currentVideoUrl}
          className="w-full h-full object-contain cursor-pointer"
          muted={isMuted}
          loop={loop}
          preload="metadata"
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={(e) => {
            e.preventDefault();
            handleVideoClick(e);
          }}
        />
      )}

      {/* CENTER PLAY BUTTON */}
      {!isPlaying && (
        <button
          onClick={handlePlayPause}
          className="absolute z-20 p-4 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all transform hover:scale-110 active:scale-95"
          title="Play video"
        >
          <Play className="w-12 h-12 text-white fill-white" />
        </button>
      )}

      {/* BOTTOM CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 space-y-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* PROGRESS BAR - SINGLE LINE LIKE YOUTUBE */}
        <div className="w-full group/progress">
          <input
            type="range"
            min="0"
            max="100"
            value={videoProgress}
            onChange={handleSeek}
            className="w-full h-1 bg-white/30 rounded-full cursor-pointer appearance-none transition-all hover:h-1.5 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:group-hover/progress:opacity-100 [&::-webkit-slider-thumb]:transition-opacity
            [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-red-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:opacity-0 [&::-moz-range-thumb]:group-hover/progress:opacity-100 [&::-moz-range-thumb]:transition-opacity"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${videoProgress}%, rgba(255,255,255,0.3) ${videoProgress}%, rgba(255,255,255,0.3) 100%)`
            }}
          />
        </div>

        {/* BUTTONS ROW */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* PLAY/PAUSE */}
            <button
              onClick={handlePlayPause}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white fill-white" />
              )}
            </button>

            {/* MUTE */}
            <button
              onClick={handleMute}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            {/* TIME DISPLAY */}
            <span className="text-sm text-white ml-3 font-mono min-w-fit">
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(videoDuration)}
            </span>
          </div>

          {/* QUALITY BADGE */}
          {showQualityBadge && (
            <div className="bg-red-500/80 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {currentQuality.toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

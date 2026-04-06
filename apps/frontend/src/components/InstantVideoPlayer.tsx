/**
 * 🎬 InstantVideoPlayer Component - TikTok/Instagram Style
 */

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const normalizeVideoUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
};

export interface VideoQuality {
  '144p'?: string;
  '240p'?: string;
  '360p'?: string;
  '480p'?: string;
  '720p'?: string;
}

export interface Video {
  id: string;
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string | null;
  qualityUrls: VideoQuality | null;
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
  videoRef?: React.RefObject<HTMLVideoElement>;
}

export function InstantVideoPlayer({
  video,
  autoPlay = false,
  muted: initialMuted = true,
  loop = false,
  className = '',
  showQualityBadge = true,
  showProcessingStatus = true,
  videoRef: externalRef,
}: InstantVideoPlayerProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalRef || localVideoRef;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentQuality, setCurrentQuality] = useState('original');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

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
      quality = video.processedUrl ? 'processed' : 'original';
    }
    
    if (url && url !== currentVideoUrl) {
      setCurrentVideoUrl(url);
      setCurrentQuality(quality);
    }
  }, [video.originalUrl, video.processedUrl, video.qualityUrls]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleVideoInteraction = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    if (isPlaying) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoDuration) * 100;
      setVideoProgress(progress);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && videoDuration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * videoDuration;
    }
  };

  return (
    <div
      className={`relative bg-black group ${className}`}
      onMouseMove={handleVideoInteraction}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={currentVideoUrl || undefined}
        poster={video.thumbnailUrl ? normalizeVideoUrl(video.thumbnailUrl) : undefined}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={handlePlayPause}
      />

      {/* Center Play/Pause Button */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={handlePlayPause}
      >
        {!isPlaying && (
          <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border-2 border-white/40 hover:bg-black/60 transition-all hover:scale-110 shadow-2xl">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/40 to-transparent pt-12 pb-4 px-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div
          className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer hover:h-2 transition-all group/progress"
          onClick={handleProgressBarClick}
        >
          <div
            className="h-full bg-white rounded-full relative transition-all"
            style={{ width: `${videoProgress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white fill-white" />
              )}
            </button>

            {/* Mute */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMuteToggle();
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
            <span className="text-xs text-white ml-2">
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(videoDuration)}
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

      {/* Complete Badge */}
      {showQualityBadge && video.status === 'COMPLETED' && (
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full" />
          HD Ready
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

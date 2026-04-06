"use client";

import { useEffect, useRef, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useActiveVideo, useVideoControls } from "@/store/videoPlaybackV2";

type Props = {
  postId: string;
  src: string;
  poster?: string;
  className?: string;
  fit?: "cover" | "contain";
  onAspectRatio?: (ratio: number) => void;
};

export default function ModalVideoMirror({ postId, src, poster, className = "", fit = "cover", onAspectRatio }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { activePostId, isPlaying, isMuted, currentTime, duration, progress, showControls } = useActiveVideo();
  const { togglePlayPause, toggleMute, seekPercent, showControlsTemporarily } = useVideoControls();

  const isTarget = activePostId === postId;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isTarget) return;

    // Sync play/pause
    if (isPlaying) {
      el.muted = true; // mirror selalu silent
      // play with catch to satisfy autoplay policies
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isPlaying, isTarget]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isTarget) return;
    // Small threshold to avoid jitter
    const diff = Math.abs((el.currentTime || 0) - (currentTime || 0));
    if (diff > 0.25) {
      el.currentTime = currentTime || 0;
    }
  }, [currentTime, isTarget]);

  useEffect(() => {
    if (!onAspectRatio) return;
    const el = videoRef.current;
    if (!el) return;

    const report = () => {
      if (el.videoWidth && el.videoHeight && el.videoHeight !== 0) {
        onAspectRatio(el.videoWidth / el.videoHeight);
      }
    };

    el.addEventListener("loadedmetadata", report);
    report();

    return () => {
      el.removeEventListener("loadedmetadata", report);
    };
  }, [onAspectRatio, src]);

  // Ensure mirror stays muted regardless of global state
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
  }, [isMuted]);

  const formatTime = useCallback((s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const onProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100; seekPercent(pct);
  };

  const videoFitClass = fit === "contain"
    ? "max-h-full max-w-full w-auto h-auto object-contain"
    : "w-full h-full object-cover";

  return (
    <div className={`relative bg-black flex items-center justify-center ${className}`} onMouseMove={showControlsTemporarily}>
      <video ref={videoRef} src={src} poster={poster} className={videoFitClass} playsInline preload="metadata" muted />
      <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => togglePlayPause()}>
        {!isPlaying && <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 hover:bg-black/70 transition-all hover:scale-110 shadow-2xl"><Play className="w-8 h-8 text-white fill-white ml-1" /></div>}
      </div>
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-4 px-4 transition-opacity ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer hover:h-2 transition-all" onClick={onProgressClick}>
          <div className="h-full bg-white rounded-full relative" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={(e)=>{ e.stopPropagation(); togglePlayPause(); }} className="p-2 hover:bg-white/20 rounded-full">
              {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white fill-white" />}
            </button>
            <button onClick={(e)=>{ e.stopPropagation(); toggleMute(); }} className="p-2 hover:bg-white/20 rounded-full">
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
            <span className="text-xs text-white/90 tabular-nums ml-1">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">Mirror</div>
        </div>
      </div>
    </div>
  );
}

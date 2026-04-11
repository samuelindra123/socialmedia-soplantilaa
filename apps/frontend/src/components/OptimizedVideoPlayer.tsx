'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useVideoPlaybackStore, useActiveVideo, useVideoControls } from '@/store/videoPlaybackV2';
import { resolveMediaUrl } from '@/lib/media-url';
import Image from '@/components/ui/SmartImage';

const norm = (url: string | null | undefined): string => resolveMediaUrl(url);

export interface VideoQuality {
  '144p'?: string; '240p'?: string; '360p'?: string; '480p'?: string; '720p'?: string;
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

interface Props {
  postId: string;
  video: VideoData;
  className?: string;
  eager?: boolean;
  initialTime?: number;
  autoResume?: boolean;
  fit?: 'cover' | 'contain';
}

function OptimizedVideoPlayerComponent({ postId, video, className = '', eager = false, initialTime, autoResume, fit = 'contain' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVisibleRef = useRef(false);
  const registeredRef = useRef(false);
  const initialTimeRef = useRef(initialTime ?? 0);
  const autoResumeRef = useRef(autoResume ?? false);

  // Set initial time + autoResume — hanya sekali saat mount
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const apply = () => {
      if (initialTimeRef.current > 0) el.currentTime = initialTimeRef.current;
      if (autoResumeRef.current) el.play().catch(() => {});
    };
    if (el.readyState >= 1) apply();
    else el.addEventListener('loadedmetadata', apply, { once: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { activePostId, isPlaying, isMuted, progress, currentTime, duration, showControls, isBuffering, isModalOpen } = useActiveVideo();
  const { togglePlayPause, toggleMute, seekPercent, showControlsTemporarily } = useVideoControls();
  const store = useVideoPlaybackStore;

  const isActive = activePostId === postId;

  // Best URL — prefer 360p untuk fast start
  const videoUrl = (() => {
    if (video.qualityUrls) {
      for (const q of ['360p', '480p', '240p', '144p', '720p'] as const) {
        const u = norm(video.qualityUrls[q]);
        if (u) return u;
      }
    }
    return norm(video.processedUrl || video.originalUrl || video.url);
  })();

  const posterUrl = norm(video.thumbnailUrl);
  const mediaFitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  const doRegister = useCallback(() => {
    const el = videoRef.current;
    if (!el || !videoUrl) return;
    registeredRef.current = true;
    store.getState().registerVideo(postId, el, videoUrl, posterUrl || null);
  }, [postId, videoUrl, posterUrl, store]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoUrl || !isActive) return;

    const playbackState = store.getState();
    if (isModalOpen || playbackState.isModalOpen) return;
    if (playbackState.videoElement === el) return;

    const restorePlayback = () => {
      const latestState = store.getState();
      if (latestState.activePostId !== postId || latestState.isModalOpen) return;
      if (Number.isFinite(latestState.currentTime) && latestState.currentTime > 0) {
        try {
          el.currentTime = latestState.currentTime;
        } catch {
          /* ignore seek race */
        }
      }
      doRegister();
      if (latestState.isPlaying) {
        void store.getState().play();
      }
    };

    if (el.readyState >= 1) {
      restorePlayback();
      return;
    }

    el.addEventListener('loadedmetadata', restorePlayback, { once: true });
    return () => {
      el.removeEventListener('loadedmetadata', restorePlayback);
    };
  }, [doRegister, isActive, isModalOpen, postId, store, videoUrl]);

  // ─── Setup: eager langsung register, feed pakai IntersectionObserver ────────
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoUrl) return;

    if (eager) {
      doRegister();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver((entries) => {
      const isVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.4;
      if (isVisible === lastVisibleRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        lastVisibleRef.current = isVisible;
        store.getState().setVideoVisible(postId, isVisible);

        if (isVisible) {
          doRegister();
          if (!store.getState().isModalOpen) void store.getState().play();
        }
      }, isVisible ? 100 : 350);
    }, { threshold: [0.4], rootMargin: '-5% 0px -5% 0px' });

    observerRef.current.observe(container);

    return () => {
      observerRef.current?.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [postId, videoUrl, eager, doRegister, store]);

  // ─── Sync muted ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current && isActive) videoRef.current.muted = isMuted;
  }, [isMuted, isActive]);

  // ─── Video events ────────────────────────────────────────────────────────────
  const onTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || !isActive) return;
    store.getState().onTimeUpdate(
      Number.isFinite(el.currentTime) ? el.currentTime : 0,
      Number.isFinite(el.duration) ? el.duration : 0,
    );
  }, [isActive, store]);

  const onPlay = useCallback(() => { if (isActive) store.getState().onPlay(); }, [isActive, store]);
  const onPause = useCallback(() => { if (isActive) store.getState().onPause(); }, [isActive, store]);
  const onEnded = useCallback(() => { if (isActive) store.getState().onEnded(); }, [isActive, store]);
  const onWaiting = useCallback(() => { if (isActive) store.getState().onWaiting(); }, [isActive, store]);
  const onCanPlay = useCallback(() => { if (isActive) store.getState().onCanPlay(); }, [isActive, store]);

  // ─── Click ───────────────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (!videoUrl) return;
    if (!isActive) doRegister();
    togglePlayPause();
  }, [isActive, videoUrl, doRegister, togglePlayPause]);

  const handleProgress = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isActive) return;
    const r = e.currentTarget.getBoundingClientRect();
    seekPercent(((e.clientX - r.left) / r.width) * 100);
  }, [isActive, seekPercent]);

  const fmt = (s: number) => !Number.isFinite(s) || s < 0 ? '0:00'
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const displayPlaying = isActive && isPlaying;
  const displayBuffering = isActive && isBuffering;
  const controlsVisible = !displayPlaying || showControls;

  return (
    <div
      ref={containerRef}
      className={`relative bg-transparent overflow-hidden ${className}`}
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
    >
      {/* ── Poster: selalu tampil di atas video saat tidak playing ── */}
      {/* Ini yang mencegah blank hitam — poster dari server langsung tampil */}
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          priority={eager}
          className={`absolute inset-0 w-full h-full ${mediaFitClass} pointer-events-none transition-opacity duration-300 ${displayPlaying ? 'opacity-0' : 'opacity-100'}`}
          style={{ zIndex: 1, backgroundColor: 'transparent' }}
        />
      ) : (
        /* Skeleton saat tidak ada poster */
        <div
          className={`absolute inset-0 bg-slate-800 transition-opacity duration-300 ${displayPlaying ? 'opacity-0' : 'opacity-100'}`}
          style={{ zIndex: 1 }}
        />
      )}

      {/* ── Video element — SELALU ada di DOM, tidak pernah di-destroy ── */}
      <video
        ref={videoRef}
        src={videoUrl || undefined}
        poster={posterUrl || undefined}
        data-post-video={postId}
        className={`w-full h-full ${mediaFitClass}`}
        style={{ zIndex: 2 }}
        muted={isMuted}
        loop
        playsInline
        preload={eager ? 'metadata' : 'none'}
        onClick={handleClick}
        onTimeUpdate={onTimeUpdate}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onWaiting={onWaiting}
        onCanPlay={onCanPlay}
      />

      {/* ── Buffering spinner ── */}
      {displayBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 5 }}>
          <div className="w-9 h-9 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* ── Play button overlay ── */}
      {!displayPlaying && !displayBuffering && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer" style={{ zIndex: 6 }} onClick={handleClick}>
          <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-black/70 transition-all hover:scale-105">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* ── Controls bar ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pt-10 pb-3 px-3 transition-opacity duration-200 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ zIndex: 7 }}
      >
        <div className="w-full h-1 bg-white/30 rounded-full mb-2.5 cursor-pointer group/bar hover:h-[5px] transition-all" onClick={handleProgress}>
          <div className="h-full bg-white rounded-full relative" style={{ width: `${isActive ? progress : 0}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleClick(); }} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            {displayPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white fill-white" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
          <span className="text-xs text-white/80 tabular-nums select-none flex-1">
            {fmt(isActive ? currentTime : 0)} / {fmt(isActive ? duration : 0)}
          </span>
        </div>
      </div>

      {video.status === 'PROCESSING' && (
        <div className="absolute top-2 right-2 bg-yellow-500/90 text-black text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ zIndex: 8 }}>
          <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
          Processing
        </div>
      )}
    </div>
  );
}

export const OptimizedVideoPlayer = memo(OptimizedVideoPlayerComponent);
export default OptimizedVideoPlayer;

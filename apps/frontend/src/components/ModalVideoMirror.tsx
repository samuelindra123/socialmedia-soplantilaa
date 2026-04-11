'use client';

/**
 * ModalVideoMirror — Zero Loading Video in Modal
 *
 * STRATEGI:
 * Video element TIDAK dipindah. Video tetap di feed (di bawah modal).
 * Modal hanya menampilkan thumbnail + controls overlay.
 * State (currentTime, isPlaying) sudah tersinkron via Zustand store.
 *
 * Ini menghilangkan semua masalah:
 * - Tidak ada DOM manipulation → tidak ada blank hitam setelah modal tutup
 * - Tidak ada video baru → tidak ada loading ulang
 * - Video di feed tetap berjalan, modal hanya mirror UI-nya
 */

import { useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useActiveVideo, useVideoControls } from '@/store/videoPlaybackV2';

type Props = {
  postId: string;
  // Props lama dipertahankan agar tidak perlu ubah PostCard
  src?: string;
  poster?: string;
  className?: string;
  fit?: 'cover' | 'contain';
  onAspectRatio?: (ratio: number) => void;
};

export default function ModalVideoMirror({ className = '', fit = 'cover' }: Props) {
  const { isPlaying, isMuted, progress, currentTime, duration, showControls, thumbnailUrl } = useActiveVideo();
  const { togglePlayPause, toggleMute, seekPercent, showControlsTemporarily } = useVideoControls();
  const mediaFitClass = fit === 'contain' ? 'object-contain' : 'object-cover';

  const handleProgress = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    seekPercent(((e.clientX - r.left) / r.width) * 100);
  }, [seekPercent]);

  const fmt = (s: number) => !Number.isFinite(s) || s < 0 ? '0:00'
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const controlsVisible = !isPlaying || showControls;

  return (
    <div
      className={`relative bg-transparent overflow-hidden ${className}`}
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
      onClick={() => togglePlayPause()}
    >
      {/* Thumbnail sebagai visual — video asli tetap di feed */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          aria-hidden
          className={`absolute inset-0 w-full h-full ${mediaFitClass} transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
        />
      )}

      {/* Dark overlay saat playing agar controls terbaca */}
      {isPlaying && (
        <div className="absolute inset-0 bg-black/20" />
      )}

      {/* Play button */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
          <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pt-10 pb-3 px-3 transition-opacity duration-200 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ zIndex: 3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-1 bg-white/30 rounded-full mb-2.5 cursor-pointer group/bar hover:h-[5px] transition-all" onClick={handleProgress}>
          <div className="h-full bg-white rounded-full relative" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => togglePlayPause()} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white fill-white" />}
          </button>
          <button onClick={() => toggleMute()} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
          <span className="text-xs text-white/80 tabular-nums select-none flex-1">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

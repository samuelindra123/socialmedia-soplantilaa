/**
 * 🎬 Video Playback Store v2 - Instagram Style
 * 
 * PRINSIP UTAMA:
 * 1. Hanya SATU video yang aktif di seluruh aplikasi
 * 2. Video element di-manage oleh store, bukan component
 * 3. Modal tidak punya video sendiri - hanya UI overlay
 * 4. Semua state tersinkronisasi via single source of truth
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface VideoPlaybackState {
  // Active video info
  activePostId: string | null;
  videoElement: HTMLVideoElement | null;
  videoUrl: string | null;
  
  // Playback state
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  isBuffering: boolean;
  
  // UI state
  showControls: boolean;
  isModalOpen: boolean;
  
  // Visibility tracking
  visibleVideos: Set<string>;
}

interface VideoPlaybackActions {
  // Video registration
  registerVideo: (postId: string, element: HTMLVideoElement, url: string) => void;
  unregisterVideo: (postId: string) => void;
  
  // Visibility tracking
  setVideoVisible: (postId: string, isVisible: boolean) => void;
  
  // Playback controls
  play: () => Promise<void>;
  pause: () => void;
  togglePlayPause: () => Promise<void>;
  
  // Audio controls
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  
  // Seeking
  seek: (time: number) => void;
  seekPercent: (percent: number) => void;
  
  // State updates (called by video events)
  onTimeUpdate: (time: number, duration: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onWaiting: () => void;
  onCanPlay: () => void;
  
  // UI
  showControlsTemporarily: () => void;
  hideControls: () => void;
  
  // Modal
  openModal: () => void;
  closeModal: () => void;
  
  // Cleanup
  reset: () => void;
}

type VideoStore = VideoPlaybackState & VideoPlaybackActions;

const initialState: VideoPlaybackState = {
  activePostId: null,
  videoElement: null,
  videoUrl: null,
  isPlaying: false,
  isMuted: true, // Instagram default: muted
  currentTime: 0,
  duration: 0,
  progress: 0,
  isBuffering: false,
  showControls: true,
  isModalOpen: false,
  visibleVideos: new Set(),
};

let controlsTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useVideoPlaybackStore = create<VideoStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    registerVideo: (postId, element, url) => {
      const { activePostId, videoElement: currentElement } = get();
      const isSameElement = currentElement === element && activePostId === postId;

      // Jika berpindah post atau element berbeda, pause yang lama
      if (currentElement && !isSameElement) {
        currentElement.pause();
      }

      // Idempotent: jangan reset waktu jika element/pos sama
      if (isSameElement) {
        set({ videoUrl: url });
        return;
      }

      const current = Number.isFinite(element.currentTime) ? element.currentTime : 0;
      const duration = Number.isFinite(element.duration) ? element.duration : 0;

      set({
        activePostId: postId,
        videoElement: element,
        videoUrl: url,
        currentTime: current,
        duration,
        progress: duration > 0 ? (current / duration) * 100 : 0,
      });

      // Sync muted state
      element.muted = get().isMuted;
    },

    unregisterVideo: (postId) => {
      const { activePostId, videoElement } = get();
      
      if (activePostId === postId) {
        if (videoElement) {
          videoElement.pause();
        }
        set({
          activePostId: null,
          videoElement: null,
          videoUrl: null,
          isPlaying: false,
          currentTime: 0,
          progress: 0,
          duration: 0,
        });
      }
    },

    setVideoVisible: (postId, isVisible) => {
      const { visibleVideos, activePostId, isModalOpen } = get();
      const newVisible = new Set(visibleVideos);
      
      if (isVisible) {
        newVisible.add(postId);
      } else {
        newVisible.delete(postId);
      }
      
      set({ visibleVideos: newVisible });
      
      // Auto-pause jika video aktif keluar dari viewport dan modal tidak terbuka
      if (!isVisible && activePostId === postId && !isModalOpen) {
        get().pause();
      }
    },

    play: async () => {
      const { videoElement, isMuted } = get();
      if (!videoElement) return;
      
      try {
        // Pastikan muted state sesuai
        videoElement.muted = isMuted;
        await videoElement.play();
        set({ isPlaying: true, showControls: false });
        get().showControlsTemporarily();
      } catch (error) {
        console.warn('Play failed:', error);
        // Coba play dengan muted jika autoplay blocked
        if (!isMuted) {
          videoElement.muted = true;
          set({ isMuted: true });
          try {
            await videoElement.play();
            set({ isPlaying: true });
          } catch (e) {
            console.error('Play failed even with mute:', e);
          }
        }
      }
    },

    pause: () => {
      const { videoElement } = get();
      if (!videoElement) return;
      
      videoElement.pause();
      set({ isPlaying: false, showControls: true });
    },

    togglePlayPause: async () => {
      const { isPlaying, play, pause } = get();
      if (isPlaying) {
        pause();
      } else {
        await play();
      }
    },

    mute: () => {
      const { videoElement } = get();
      if (videoElement) {
        videoElement.muted = true;
      }
      set({ isMuted: true });
    },

    unmute: () => {
      const { videoElement } = get();
      if (videoElement) {
        videoElement.muted = false;
      }
      set({ isMuted: false });
    },

    toggleMute: () => {
      const { isMuted, mute, unmute } = get();
      if (isMuted) {
        unmute();
      } else {
        mute();
      }
    },

    seek: (time) => {
      const { videoElement, duration } = get();
      if (!videoElement || !duration) return;
      
      const clampedTime = Math.max(0, Math.min(time, duration));
      videoElement.currentTime = clampedTime;
      set({ 
        currentTime: clampedTime,
        progress: (clampedTime / duration) * 100,
      });
    },

    seekPercent: (percent) => {
      const { duration, seek } = get();
      if (!duration) return;
      
      const time = (percent / 100) * duration;
      seek(time);
    },

    onTimeUpdate: (time, duration) => {
      if (!Number.isFinite(time) || !Number.isFinite(duration)) return;
      
      set({
        currentTime: time,
        duration: duration,
        progress: duration > 0 ? (time / duration) * 100 : 0,
      });
    },

    onPlay: () => {
      set({ isPlaying: true, isBuffering: false });
    },

    onPause: () => {
      set({ isPlaying: false, showControls: true });
    },

    onEnded: () => {
      // Loop behavior - restart video
      const { videoElement } = get();
      if (videoElement) {
        videoElement.currentTime = 0;
        videoElement.play().catch(() => {});
      }
    },

    onWaiting: () => {
      set({ isBuffering: true });
    },

    onCanPlay: () => {
      set({ isBuffering: false });
    },

    showControlsTemporarily: () => {
      set({ showControls: true });
      
      if (controlsTimeoutId) {
        clearTimeout(controlsTimeoutId);
      }
      
      const { isPlaying } = get();
      if (isPlaying) {
        controlsTimeoutId = setTimeout(() => {
          set({ showControls: false });
        }, 3000);
      }
    },

    hideControls: () => {
      const { isPlaying } = get();
      if (isPlaying) {
        set({ showControls: false });
      }
    },

  openModal: () => {
      // Saat modal dibuka, sumber audio dialihkan ke modal (mirror dimute)
      // Prinsip: hanya satu sumber audio aktif
      const { videoElement } = get();
      if (videoElement) {
        // Ketika modal aktif, tetap playing namun pastikan muted mengikuti state
        videoElement.muted = get().isMuted;
      }
      set({ isModalOpen: true, showControls: true });
  },

  closeModal: () => {
      // Saat modal ditutup, kembalikan kontrol ke feed
      const { videoElement } = get();
      if (videoElement) {
        videoElement.muted = get().isMuted;
      }
      set({ isModalOpen: false, showControls: true });
  },

    reset: () => {
      const { videoElement } = get();
      if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
      
      if (controlsTimeoutId) {
        clearTimeout(controlsTimeoutId);
      }
      
      set({
        ...initialState,
        visibleVideos: new Set(),
      });
    },
  }))
);

// Selector hooks dengan useShallow untuk mencegah infinite loop
export const useActiveVideo = () => useVideoPlaybackStore(
  useShallow((s) => ({
    activePostId: s.activePostId,
    isPlaying: s.isPlaying,
    isMuted: s.isMuted,
    progress: s.progress,
    currentTime: s.currentTime,
    duration: s.duration,
    showControls: s.showControls,
    isBuffering: s.isBuffering,
    isModalOpen: s.isModalOpen,
  }))
);

export const useVideoControls = () => useVideoPlaybackStore(
  useShallow((s) => ({
    play: s.play,
    pause: s.pause,
    togglePlayPause: s.togglePlayPause,
    toggleMute: s.toggleMute,
    seekPercent: s.seekPercent,
    showControlsTemporarily: s.showControlsTemporarily,
    openModal: s.openModal,
    closeModal: s.closeModal,
  }))
);

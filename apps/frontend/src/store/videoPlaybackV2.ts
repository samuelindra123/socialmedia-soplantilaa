import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface VideoPlaybackState {
  activePostId: string | null;
  videoElement: HTMLVideoElement | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;

  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  isBuffering: boolean;

  showControls: boolean;
  isModalOpen: boolean;

  visibleVideos: Set<string>;
}

interface VideoPlaybackActions {
  registerVideo: (postId: string, element: HTMLVideoElement, url: string, thumbnailUrl?: string | null) => void;
  unregisterVideo: (postId: string) => void;
  setVideoVisible: (postId: string, isVisible: boolean) => void;

  play: () => Promise<void>;
  pause: () => void;
  togglePlayPause: () => Promise<void>;

  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;

  seek: (time: number) => void;
  seekPercent: (percent: number) => void;

  onTimeUpdate: (time: number, duration: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onWaiting: () => void;
  onCanPlay: () => void;

  showControlsTemporarily: () => void;
  hideControls: () => void;

  openModal: () => void;
  closeModal: () => void;

  reset: () => void;
}

type VideoStore = VideoPlaybackState & VideoPlaybackActions;

const initialState: VideoPlaybackState = {
  activePostId: null,
  videoElement: null,
  videoUrl: null,
  thumbnailUrl: null,
  isPlaying: false,
  isMuted: true,
  currentTime: 0,
  duration: 0,
  progress: 0,
  isBuffering: false,
  showControls: true,
  isModalOpen: false,
  visibleVideos: new Set(),
};

let controlsTimeoutId: ReturnType<typeof setTimeout> | null = null;
let playRequestToken = 0;

const isAbortError = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

export const useVideoPlaybackStore = create<VideoStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    registerVideo: (postId, element, url, thumbnailUrl = null) => {
      const { activePostId, videoElement: cur } = get();
      const same = cur === element && activePostId === postId;

      if (cur && !same) {
        playRequestToken++;
        cur.pause();
      }

      if (same) {
        set({ videoUrl: url, thumbnailUrl: thumbnailUrl ?? get().thumbnailUrl });
        return;
      }

      const ct = Number.isFinite(element.currentTime) ? element.currentTime : 0;
      const dur = Number.isFinite(element.duration) ? element.duration : 0;
      const playing = !element.paused && !element.ended;

      set({
        activePostId: postId,
        videoElement: element,
        videoUrl: url,
        thumbnailUrl,
        currentTime: ct,
        duration: dur,
        progress: dur > 0 ? (ct / dur) * 100 : 0,
        isPlaying: playing,
        showControls: !playing,
      });

      element.muted = get().isMuted;
    },

    unregisterVideo: (postId) => {
      const { activePostId, videoElement } = get();
      if (activePostId !== postId) return;
      videoElement?.pause();
      set({ activePostId: null, videoElement: null, videoUrl: null, thumbnailUrl: null, isPlaying: false, currentTime: 0, progress: 0, duration: 0 });
    },

    setVideoVisible: (postId, isVisible) => {
      const { visibleVideos, activePostId, isModalOpen } = get();
      const next = new Set(visibleVideos);
      isVisible ? next.add(postId) : next.delete(postId);
      set({ visibleVideos: next });
      if (!isVisible && activePostId === postId && !isModalOpen) get().pause();
    },

    play: async () => {
      const { videoElement, isMuted } = get();
      if (!videoElement) return;
      const token = ++playRequestToken;

      try {
        videoElement.muted = isMuted;
        await videoElement.play();
        if (token !== playRequestToken || get().videoElement !== videoElement) return;
        set({ isPlaying: true, showControls: false });
        get().showControlsTemporarily();
      } catch (err) {
        if (token !== playRequestToken) return;
        if (isAbortError(err)) {
          const { activePostId, visibleVideos, isModalOpen } = get();
          const canRetry = get().videoElement === videoElement && (isModalOpen || (!!activePostId && visibleVideos.has(activePostId)));
          if (!canRetry) return;
          try {
            await new Promise(r => setTimeout(r, 120));
            if (token !== playRequestToken || get().videoElement !== videoElement) return;
            await videoElement.play();
            if (token !== playRequestToken || get().videoElement !== videoElement) return;
            set({ isPlaying: true, showControls: false });
            get().showControlsTemporarily();
          } catch (e2) { if (!isAbortError(e2)) console.warn('Play retry failed:', e2); }
          return;
        }
        // Fallback: force muted
        videoElement.muted = true;
        set({ isMuted: true });
        try { await videoElement.play(); set({ isPlaying: true }); } catch { /* ignore */ }
      }
    },

    pause: () => {
      const { videoElement } = get();
      if (!videoElement) return;
      playRequestToken++;
      videoElement.pause();
      set({ isPlaying: false, showControls: true });
    },

    togglePlayPause: async () => {
      const { isPlaying, play, pause } = get();
      isPlaying ? pause() : await play();
    },

    mute: () => { const { videoElement } = get(); if (videoElement) videoElement.muted = true; set({ isMuted: true }); },
    unmute: () => { const { videoElement } = get(); if (videoElement) videoElement.muted = false; set({ isMuted: false }); },
    toggleMute: () => { get().isMuted ? get().unmute() : get().mute(); },

    seek: (time) => {
      const { videoElement, duration } = get();
      if (!videoElement || !duration) return;
      const t = Math.max(0, Math.min(time, duration));
      videoElement.currentTime = t;
      set({ currentTime: t, progress: (t / duration) * 100 });
    },

    seekPercent: (pct) => {
      const { duration, seek } = get();
      if (duration) seek((pct / 100) * duration);
    },

    onTimeUpdate: (time, duration) => {
      if (!Number.isFinite(time) || !Number.isFinite(duration)) return;
      set({ currentTime: time, duration, progress: duration > 0 ? (time / duration) * 100 : 0 });
    },

    onPlay: () => set({ isPlaying: true, isBuffering: false }),
    onPause: () => set({ isPlaying: false, showControls: true }),
    onEnded: () => {
      const { videoElement } = get();
      if (videoElement) { videoElement.currentTime = 0; videoElement.play().catch(() => {}); }
    },
    onWaiting: () => set({ isBuffering: true }),
    onCanPlay: () => set({ isBuffering: false }),

    showControlsTemporarily: () => {
      set({ showControls: true });
      if (controlsTimeoutId) clearTimeout(controlsTimeoutId);
      if (get().isPlaying) {
        controlsTimeoutId = setTimeout(() => set({ showControls: false }), 3000);
      }
    },

    hideControls: () => { if (get().isPlaying) set({ showControls: false }); },

    openModal: () => {
      const { videoElement } = get();
      if (videoElement) videoElement.muted = get().isMuted;
      set({ isModalOpen: true, showControls: true });
    },

    closeModal: () => {
      const { videoElement } = get();
      if (videoElement) videoElement.muted = get().isMuted;
      set({ isModalOpen: false, showControls: true });
    },

    reset: () => {
      const { videoElement } = get();
      if (videoElement) { videoElement.pause(); videoElement.currentTime = 0; }
      if (controlsTimeoutId) clearTimeout(controlsTimeoutId);
      set({ ...initialState, visibleVideos: new Set() });
    },
  }))
);

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
    thumbnailUrl: s.thumbnailUrl,
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

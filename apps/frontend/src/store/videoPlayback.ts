/**
 * 🎬 Video Playback Store - Zustand
 * Single source of truth untuk semua video playback state
 * Solusi untuk: ghost video, state tidak sinkron, autoplay hilang
 */

import { create } from 'zustand';

interface VideoState {
  // Current active video
  activeVideoId: string | null;
  
  // Playback state
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  
  // UI state
  showControls: boolean;
  isModalOpen: boolean;
  
  // Video element ref (single source)
  videoElement: HTMLVideoElement | null;
}

interface VideoActions {
  // Core actions
  setActiveVideo: (videoId: string | null) => void;
  setVideoElement: (element: HTMLVideoElement | null) => void;
  
  // Playback controls
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  toggleMute: () => void;
  seek: (time: number) => void;
  seekByPercent: (percent: number) => void;
  
  // State updates
  updateTime: (time: number) => void;
  updateDuration: (duration: number) => void;
  updateProgress: (progress: number) => void;
  setShowControls: (show: boolean) => void;
  
  // Modal state
  openModal: () => void;
  closeModal: () => void;
  
  // Reset
  reset: () => void;
}

type VideoStore = VideoState & VideoActions;

const initialState: VideoState = {
  activeVideoId: null,
  isPlaying: false,
  isMuted: true,
  currentTime: 0,
  duration: 0,
  progress: 0,
  showControls: true,
  isModalOpen: false,
  videoElement: null,
};

export const useVideoStore = create<VideoStore>((set, get) => ({
  ...initialState,

  setActiveVideo: (videoId) => {
    const { videoElement, activeVideoId } = get();
    
    // Pause current video if switching to different video
    if (activeVideoId && activeVideoId !== videoId && videoElement) {
      videoElement.pause();
    }
    
    set({
      activeVideoId: videoId,
      currentTime: 0,
      progress: 0,
      isPlaying: false,
    });
  },

  setVideoElement: (element) => {
    set({ videoElement: element });
  },

  play: async () => {
    const { videoElement } = get();
    if (!videoElement) return;
    
    try {
      await videoElement.play();
      set({ isPlaying: true, showControls: false });
    } catch (error) {
      console.warn('Video play failed:', error);
      set({ isPlaying: false });
    }
  },

  pause: () => {
    const { videoElement } = get();
    if (!videoElement) return;
    
    videoElement.pause();
    set({ isPlaying: false, showControls: true });
  },

  togglePlay: async () => {
    const { isPlaying, play, pause } = get();
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  },

  toggleMute: () => {
    const { videoElement, isMuted } = get();
    if (!videoElement) return;
    
    videoElement.muted = !isMuted;
    set({ isMuted: !isMuted });
  },

  seek: (time) => {
    const { videoElement } = get();
    if (!videoElement || !Number.isFinite(time)) return;
    
    videoElement.currentTime = time;
    set({ currentTime: time });
  },

  seekByPercent: (percent) => {
    const { videoElement, duration } = get();
    if (!videoElement || !duration) return;
    
    const time = (percent / 100) * duration;
    videoElement.currentTime = time;
    set({ currentTime: time });
  },

  updateTime: (time) => {
    const { duration } = get();
    const progress = duration > 0 ? (time / duration) * 100 : 0;
    set({ currentTime: time, progress });
  },

  updateDuration: (duration) => {
    set({ duration });
  },

  updateProgress: (progress) => {
    set({ progress });
  },

  setShowControls: (show) => {
    set({ showControls: show });
  },

  openModal: () => {
    const { videoElement, currentTime, isPlaying } = get();
    
    // Save current state before opening modal
    set({ 
      isModalOpen: true,
      showControls: true,
    });
    
    // Video will continue playing - no pause needed
    // The same video element will be moved to modal
  },

  closeModal: () => {
    set({ 
      isModalOpen: false,
      showControls: true,
    });
    
    // Video continues playing - state preserved
  },

  reset: () => {
    const { videoElement } = get();
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
    set(initialState);
  },
}));

// Selector hooks for optimized re-renders
export const useVideoPlayback = () => useVideoStore((state) => ({
  isPlaying: state.isPlaying,
  isMuted: state.isMuted,
  currentTime: state.currentTime,
  duration: state.duration,
  progress: state.progress,
  showControls: state.showControls,
}));

export const useVideoControls = () => useVideoStore((state) => ({
  play: state.play,
  pause: state.pause,
  togglePlay: state.togglePlay,
  toggleMute: state.toggleMute,
  seek: state.seek,
  seekByPercent: state.seekByPercent,
  setShowControls: state.setShowControls,
}));

export const useVideoModal = () => useVideoStore((state) => ({
  isModalOpen: state.isModalOpen,
  openModal: state.openModal,
  closeModal: state.closeModal,
}));

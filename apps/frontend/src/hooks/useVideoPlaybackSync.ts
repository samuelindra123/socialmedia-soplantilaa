/**
 * 🎬 useVideoPlaybackSync - Sinkronisasi video playback saat modal buka/tutup
 * Memastikan video tetap jalan saat membuka comment modal
 */

import { useState, useCallback, useRef } from 'react';

interface VideoState {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export function useVideoPlaybackSync() {
  const [videoState, setVideoState] = useState<VideoState | null>(null);
  const videoRefMap = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Register video element
  const registerVideo = useCallback(
    (videoId: string, videoElement: HTMLVideoElement | null) => {
      if (videoElement) {
        videoRefMap.current.set(videoId, videoElement);
      } else {
        videoRefMap.current.delete(videoId);
      }
    },
    []
  );

  // Save current playback state
  const savePlaybackState = useCallback((videoId: string) => {
    const videoEl = videoRefMap.current.get(videoId);
    if (videoEl) {
      setVideoState({
        videoId,
        isPlaying: !videoEl.paused,
        currentTime: videoEl.currentTime,
        duration: videoEl.duration,
      });
    }
  }, []);

  // Restore playback state
  const restorePlaybackState = useCallback((videoId: string) => {
    const videoEl = videoRefMap.current.get(videoId);
    if (videoEl && videoState?.videoId === videoId) {
      videoEl.currentTime = videoState.currentTime;
      if (videoState.isPlaying) {
        videoEl.play().catch(err => console.log('Resume prevented:', err));
      }
    }
  }, [videoState]);

  // Keep all videos paused except active one
  const pauseOtherVideos = useCallback((activeVideoId: string) => {
    videoRefMap.current.forEach((videoEl, id) => {
      if (id !== activeVideoId && !videoEl.paused) {
        videoEl.pause();
      }
    });
  }, []);

  return {
    videoState,
    registerVideo,
    savePlaybackState,
    restorePlaybackState,
    pauseOtherVideos,
  };
}

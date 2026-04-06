/**
 * 🎬 Video Playback Context - Sinkronisasi state video across modals
 * Untuk Instagram-style UX dimana video tetap play saat membuka comments
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface VideoPlaybackState {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface VideoPlaybackContextType {
  activeVideo: VideoPlaybackState | null;
  setActiveVideo: (video: VideoPlaybackState) => void;
  updatePlaybackState: (videoId: string, isPlaying: boolean, currentTime: number) => void;
  clearActiveVideo: () => void;
}

const VideoPlaybackContext = createContext<VideoPlaybackContextType | undefined>(undefined);

export function VideoPlaybackProvider({ children }: { children: React.ReactNode }) {
  const [activeVideo, setActiveVideoState] = useState<VideoPlaybackState | null>(null);

  const setActiveVideo = useCallback((video: VideoPlaybackState) => {
    setActiveVideoState(video);
  }, []);

  const updatePlaybackState = useCallback(
    (videoId: string, isPlaying: boolean, currentTime: number) => {
      setActiveVideoState((prev) =>
        prev && prev.videoId === videoId
          ? { ...prev, isPlaying, currentTime }
          : prev
      );
    },
    []
  );

  const clearActiveVideo = useCallback(() => {
    setActiveVideoState(null);
  }, []);

  return (
    <VideoPlaybackContext.Provider
      value={{
        activeVideo,
        setActiveVideo,
        updatePlaybackState,
        clearActiveVideo,
      }}
    >
      {children}
    </VideoPlaybackContext.Provider>
  );
}

export function useVideoPlayback() {
  const context = useContext(VideoPlaybackContext);
  if (!context) {
    throw new Error('useVideoPlayback must be used within VideoPlaybackProvider');
  }
  return context;
}

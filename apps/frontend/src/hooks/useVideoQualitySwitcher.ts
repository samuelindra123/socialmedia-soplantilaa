/**
 * 🎬 Auto Quality Switcher Hook - Instagram/TikTok Style
 * 
 * Strategi:
 * 1. Mulai dengan originalUrl (instant playback)
 * 2. Poll setiap 3 detik untuk cek kualitas baru
 * 3. Auto-switch ke kualitas lebih baik tanpa menghentikan playback
 * 4. Simpan currentTime sebelum switch untuk seamless transition
 * 
 * Kenapa ini penting:
 * - User melihat video INSTANTLY (0 detik wait)
 * - Tidak ada black screen
 * - Video upgrade otomatis ke kualitas lebih baik
 * - UX smooth seperti TikTok
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Ensure URL is absolute and has proper protocol
 */
const normalizeVideoUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  // Already has protocol
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Has protocol-relative path
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  
  // Has domain but missing protocol (e.g., "sgp1.digitaloceanspaces.com/...")
  if (trimmed.includes('.') && !trimmed.startsWith('/')) {
    return `https://${trimmed}`;
  }
  
  // Relative path - not valid for video
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

interface UseVideoQualitySwitcherOptions {
  video: Video;
  autoPlay?: boolean;
  onQualityChange?: (quality: string) => void;
}

export function useVideoQualitySwitcher({
  video,
  autoPlay = false,
  onQualityChange,
}: UseVideoQualitySwitcherOptions) {
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentQuality, setCurrentQuality] = useState<string>('original');
  const [isBuffering, setIsBuffering] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastCheckedQuality = useRef<string>('original');

  // Quality priority order (from lowest to highest)
  const QUALITY_PRIORITY = ['144p', '240p', '360p', '480p', '720p'] as const;

  /**
   * Determine best available quality
   */
  const getBestQuality = (): { url: string; quality: string } => {
    // Prioritas:
    // 1. Cek qualityUrls dari tertinggi ke terendah
    // 2. Fallback ke processedUrl
    // 3. Fallback ke originalUrl

    if (video.qualityUrls) {
      // Loop dari kualitas tertinggi
      for (let i = QUALITY_PRIORITY.length - 1; i >= 0; i--) {
        const quality = QUALITY_PRIORITY[i];
        const url = video.qualityUrls[quality];
        if (url && typeof url === 'string') {
          const normalized = normalizeVideoUrl(url);
          if (normalized) {
            console.log(`✅ Found ${quality} quality: ${normalized.substring(0, 50)}...`);
            return { url: normalized, quality };
          }
        }
      }
    }

    if (video.processedUrl && typeof video.processedUrl === 'string') {
      const normalized = normalizeVideoUrl(video.processedUrl);
      if (normalized) {
        console.log(`✅ Using processedUrl: ${normalized.substring(0, 50)}...`);
        return { url: normalized, quality: 'processed' };
      }
    }

    if (video.originalUrl && typeof video.originalUrl === 'string') {
      const normalized = normalizeVideoUrl(video.originalUrl);
      if (normalized) {
        console.log(`✅ Using originalUrl: ${normalized.substring(0, 50)}...`);
        return { url: normalized, quality: 'original' };
      }
    }

    return { url: '', quality: 'none' };
  };

  /**
   * Switch to new quality seamlessly
   */
  const switchQuality = (newUrl: string, newQuality: string) => {
    if (!videoRef.current || currentVideoUrl === newUrl || !newUrl) return;

    const currentTime = videoRef.current.currentTime;
    const isPaused = videoRef.current.paused;

    setIsBuffering(true);
    setCurrentVideoUrl(newUrl);
    setCurrentQuality(newQuality);
    lastCheckedQuality.current = newQuality;

    // Wait for new video to load
    const handleCanPlay = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime; // Resume at same position
        if (!isPaused && autoPlay) {
          videoRef.current.play().catch(console.error);
        }
        setIsBuffering(false);
      }
      videoRef.current?.removeEventListener('canplay', handleCanPlay);
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('canplay', handleCanPlay);
    }

    onQualityChange?.(newQuality);
    console.log(`⚡ Quality switched: ${lastCheckedQuality.current} → ${newQuality}`);
  };

  /**
   * Initialize with best available quality - IMMEDIATELY
   */
  useEffect(() => {
    const { url, quality } = getBestQuality();
    console.log(`🎬 getBestQuality returned:`, { url, quality, video });
    
    if (url && url.trim() && !currentVideoUrl) {
      console.log(`🎬 Setting initial URL:`, url);
      setCurrentVideoUrl(url);
      setCurrentQuality(quality);
      setCanPlay(true);
      lastCheckedQuality.current = quality;
    }
  }, [video.originalUrl, video.processedUrl, video.qualityUrls]); // Only depend on URL changes

  /**
   * Poll for quality upgrades every 3 seconds
   */
  useEffect(() => {
    if (video.status === 'COMPLETED' || !canPlay) {
      return;
    }

    const pollInterval = setInterval(() => {
      const { url, quality } = getBestQuality();
      
      // Cek apakah ada kualitas lebih baik
      if (quality !== lastCheckedQuality.current && url && url.trim()) {
        console.log(`🔄 New quality available: ${quality}`);
        switchQuality(url, quality);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [video, currentVideoUrl, canPlay]);

  return {
    videoRef,
    currentVideoUrl,
    currentQuality,
    isBuffering,
    thumbnailUrl: video.thumbnailUrl,
    canPlay: canPlay && !!currentVideoUrl,
  };
}

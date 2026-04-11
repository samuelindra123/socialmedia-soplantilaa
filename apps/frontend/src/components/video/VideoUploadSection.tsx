'use client';

import { useRef, useState, useCallback } from 'react';

interface VideoState {
  phase: 'idle' | 'generating' | 'selected';
  file?: File;
  thumbBlob?: Blob | null;
  thumbPreview?: string | null;
  error?: string;
}

interface VideoUploadSectionProps {
  onFileSelected: (file: File, thumbBlob: Blob | null) => void;
  onFileRemoved: () => void;
  disabled?: boolean;
}

// Ambil satu frame dari video pada waktu tertentu, return ImageData brightness score + blob
const captureFrame = (
  video: HTMLVideoElement,
  time: number,
): Promise<{ blob: Blob; brightness: number } | null> =>
  new Promise((resolve) => {
    video.currentTime = time;
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      try {
        const canvas = document.createElement('canvas');
        const MAX = 1280;
        const ratio = Math.min(MAX / video.videoWidth, MAX / video.videoHeight, 1);
        canvas.width = Math.round(video.videoWidth * ratio);
        canvas.height = Math.round(video.videoHeight * ratio);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Sample brightness dari 100 pixel acak
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        let sum = 0;
        const step = Math.max(1, Math.floor(d.length / 400)); // ~100 pixel samples
        let count = 0;
        for (let i = 0; i < d.length; i += step * 4) {
          sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          count++;
        }
        const brightness = count > 0 ? sum / count : 0;

        canvas.toBlob(
          (blob) => resolve(blob ? { blob, brightness } : null),
          'image/jpeg',
          0.85,
        );
      } catch {
        resolve(null);
      }
    };
    video.addEventListener('seeked', onSeeked);
  });

// Ambil thumbnail terbaik dari 3 titik (seperti YouTube) — pilih frame paling terang
const generateThumbnail = (file: File): Promise<Blob | null> =>
  new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.src = url;
    const cleanup = () => URL.revokeObjectURL(url);

    const timeout = setTimeout(() => { cleanup(); resolve(null); }, 15000);

    video.onloadedmetadata = async () => {
      try {
        const dur = video.duration;
        if (!dur || !isFinite(dur)) { cleanup(); clearTimeout(timeout); resolve(null); return; }

        // Simpan dimensi video untuk dikirim ke backend
        ;(file as any)._videoWidth = video.videoWidth;
        ;(file as any)._videoHeight = video.videoHeight;
        ;(file as any)._videoDuration = Math.round(dur);

        // 3 kandidat: 10%, 30%, 50% durasi — hindari detik 0 (sering hitam)
        const times = [
          Math.max(0.5, dur * 0.1),
          dur * 0.3,
          dur * 0.5,
        ].filter(t => t < dur);

        const frames = await Promise.all(times.map(t => captureFrame(video, t)));
        cleanup();
        clearTimeout(timeout);

        // Pilih frame dengan brightness tertinggi (bukan hitam/gelap)
        const best = frames
          .filter((f): f is { blob: Blob; brightness: number } => f !== null && f.brightness > 10)
          .sort((a, b) => b.brightness - a.brightness)[0];

        resolve(best?.blob ?? frames.find(f => f !== null)?.blob ?? null);
      } catch {
        cleanup();
        clearTimeout(timeout);
        resolve(null);
      }
    };
    video.onerror = () => { cleanup(); clearTimeout(timeout); resolve(null); };
  });

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const MAX_SIZE_MB = 200;

export function VideoUploadSection({ onFileSelected, onFileRemoved, disabled }: VideoUploadSectionProps) {
  const [state, setState] = useState<VideoState>({ phase: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setState({ phase: 'selected', file, thumbBlob: null, thumbPreview: null, error: 'Format tidak didukung. Gunakan MP4, MOV, atau WebM' });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setState({ phase: 'selected', file, thumbBlob: null, thumbPreview: null, error: `Ukuran maksimal ${MAX_SIZE_MB}MB` });
      return;
    }
    setState({ phase: 'generating' });
    const thumbBlob = await generateThumbnail(file);
    const thumbPreview = thumbBlob ? URL.createObjectURL(thumbBlob) : null;
    setState({ phase: 'selected', file, thumbBlob, thumbPreview });
    onFileSelected(file, thumbBlob);
  }, [onFileSelected]);

  const handleRemove = useCallback(() => {
    if (state.phase === 'selected' && state.thumbPreview) {
      URL.revokeObjectURL(state.thumbPreview);
    }
    setState({ phase: 'idle' });
    onFileRemoved();
    if (inputRef.current) inputRef.current.value = '';
  }, [state, onFileRemoved]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (state.phase === 'idle') {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !disabled && inputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all"
      >
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          <p className="font-medium text-sm text-slate-600 dark:text-slate-300">Pilih atau drag video ke sini</p>
          <p className="text-xs text-slate-400">MP4, MOV, WebM — Maks {MAX_SIZE_MB}MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
    );
  }

  if (state.phase === 'generating') {
    return (
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-6 flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500">Memproses preview...</span>
      </div>
    );
  }

  // phase === 'selected'
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {state.thumbPreview ? (
        <div className="aspect-video bg-black relative">
          <img src={state.thumbPreview} alt="Preview video" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{state.file?.name}</p>
            <p className="text-xs text-slate-400">{((state.file?.size ?? 0) / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
        </div>
        <button onClick={handleRemove} className="ml-2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {state.error && (
        <p className="px-3 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20">{state.error}</p>
      )}
    </div>
  );
}

export default VideoUploadSection;

export interface VideoUploadResponse {
  id: string;
  status: 'READY';
  videoUrl: string;
  thumbnailUrl: string | null;
}

const videoService = {
  uploadVideo(
    file: File,
    thumbnailBlob: Blob | undefined,
    onProgress?: (percent: number) => void,
  ): Promise<VideoUploadResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('video', file);
      if (thumbnailBlob) {
        formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
      }
      // Kirim metadata dimensi agar backend bisa simpan tanpa ffmpeg
      const f = file as any;
      if (f._videoWidth) formData.append('width', String(f._videoWidth));
      if (f._videoHeight) formData.append('height', String(f._videoHeight));
      if (f._videoDuration) formData.append('duration', String(f._videoDuration));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/video-upload');  // Node.js runtime — no 4MB edge limit
      xhr.withCredentials = true;
      xhr.timeout = 10 * 60 * 1000;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress?.(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as VideoUploadResponse);
          } catch {
            reject(new Error('Response tidak valid dari server'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.message ?? `Upload gagal (${xhr.status})`));
          } catch {
            reject(new Error(`Upload gagal (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Koneksi gagal saat upload'));
      xhr.ontimeout = () => reject(new Error('Upload timeout (>10 menit)'));
      xhr.send(formData);
    });
  },
};

export default videoService;

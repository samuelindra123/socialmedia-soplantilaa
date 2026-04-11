import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';
import videoService from '@/lib/api/videoService';

export type UploadTaskStatus =
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'canceled';

export interface UploadTask {
  id: string;
  mediaType: 'video';
  fileName: string;
  fileSize: number;
  progress: number;
  status: UploadTaskStatus;
  message: string;
  error?: string;
  startedAt: string;
  updatedAt: string;
}

interface UploadTaskState {
  tasks: UploadTask[];
  startSimpleVideoUpload: (
    file: File,
    thumbBlob: Blob | undefined,
    postPayload: { content: string; title?: string; tags?: string[] },
  ) => void;
  dismissTask: (taskId: string) => void;
}

const nowIso = () => new Date().toISOString();

const setTaskStatus = (
  taskId: string,
  patch: Partial<UploadTask>,
) => {
  useUploadTaskStore.setState((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, ...patch, updatedAt: nowIso() } : t,
    ),
  }));
};

export const useUploadTaskStore = create<UploadTaskState>((set) => ({
  tasks: [],

  startSimpleVideoUpload: (file, thumbBlob, postPayload) => {
    const taskId = crypto.randomUUID();

    set((state) => ({
      tasks: [
        {
          id: taskId,
          mediaType: 'video',
          fileName: file.name,
          fileSize: file.size,
          progress: 0,
          status: 'uploading',
          message: 'Mengunggah video...',
          startedAt: nowIso(),
          updatedAt: nowIso(),
        },
        ...state.tasks,
      ],
    }));

    void (async () => {
      try {
        const { id: videoId } = await videoService.uploadVideo(
          file,
          thumbBlob,
          (percent) => {
            setTaskStatus(taskId, { progress: percent, message: `Mengunggah... ${percent}%` });
          },
        );

        setTaskStatus(taskId, { status: 'processing', progress: 100, message: 'Memposting...' });

        await apiClient.post('/posts/video-from-id', {
          videoId,
          content: postPayload.content,
          title: postPayload.title,
          tags: postPayload.tags ?? [],
        });

        setTaskStatus(taskId, { status: 'completed', progress: 100, message: 'Video berhasil diposting! 🎉' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload gagal';
        setTaskStatus(taskId, { status: 'failed', progress: 0, error: message, message });
      }
    })();
  },

  dismissTask: (taskId) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
  },
}));

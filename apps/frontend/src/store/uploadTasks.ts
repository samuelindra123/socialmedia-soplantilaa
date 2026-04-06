import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_RETRY_PER_CHUNK = 3;
const CHUNK_CONCURRENCY = 3;

export type UploadTaskStatus =
  | 'queued'
  | 'creating-session'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'canceled';

export interface UploadTask {
  id: string;
  sessionId?: string;
  mediaType: 'video';
  fileName: string;
  fileSize: number;
  progress: number;
  status: UploadTaskStatus;
  uploadedChunks: number;
  totalChunks: number;
  message: string;
  error?: string;
  startedAt: string;
  updatedAt: string;
}

interface StartVideoUploadInput {
  file: File;
  title?: string;
  description?: string;
  tags?: string[];
}

interface UploadStatusPayload {
  taskId: string;
  sessionId?: string;
  status?: UploadTaskStatus;
  progress?: number;
  uploadedChunks?: number;
  totalChunks?: number;
  message?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
}

interface UploadTaskState {
  tasks: UploadTask[];
  startVideoUpload: (input: StartVideoUploadInput) => Promise<string>;
  retryTask: (taskId: string) => Promise<void>;
  cancelTask: (taskId: string) => Promise<void>;
  dismissTask: (taskId: string) => void;
  applyServerStatus: (payload: UploadStatusPayload) => void;
}

const uploadAbortControllers = new Map<string, AbortController>();
const uploadTaskPayload = new Map<string, StartVideoUploadInput>();

const nowIso = () => new Date().toISOString();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const updateTaskInStore = (
  taskId: string,
  updater: (task: UploadTask) => UploadTask,
) => {
  useUploadTaskStore.setState((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === taskId ? updater(task) : task,
    ),
  }));
};

const createTask = (taskId: string, file: File): UploadTask => ({
  id: taskId,
  mediaType: 'video',
  fileName: file.name,
  fileSize: file.size,
  progress: 0,
  status: 'queued',
  uploadedChunks: 0,
  totalChunks: Math.max(1, Math.ceil(file.size / CHUNK_SIZE)),
  message: 'Masuk antrian upload',
  startedAt: nowIso(),
  updatedAt: nowIso(),
});

const setTaskStatus = (
  taskId: string,
  patch: Partial<UploadTask> & { message?: string },
) => {
  updateTaskInStore(taskId, (task) => ({
    ...task,
    ...patch,
    updatedAt: nowIso(),
    message: patch.message ?? task.message,
  }));
};

const uploadChunkWithRetry = async (
  taskId: string,
  sessionId: string,
  chunkIndex: number,
  chunk: Blob,
  signal: AbortSignal,
) => {
  let attempt = 0;
  while (attempt < MAX_RETRY_PER_CHUNK) {
    try {
      const formData = new FormData();
      formData.append('chunk', chunk, `chunk-${chunkIndex}.part`);

      await apiClient.put(
        `/videos/resumable/sessions/${sessionId}/chunks/${chunkIndex}`,
        formData,
        {
          signal,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      return;
    } catch (error) {
      attempt += 1;
      if (attempt >= MAX_RETRY_PER_CHUNK) {
        throw error;
      }

      setTaskStatus(taskId, {
        status: 'uploading',
        message: `Retry chunk ${chunkIndex + 1} (${attempt}/${MAX_RETRY_PER_CHUNK - 1})`,
      });

      await wait(250 * attempt);
    }
  }
};

const runVideoUpload = async (taskId: string) => {
  const payload = uploadTaskPayload.get(taskId);
  if (!payload) {
    return;
  }

  const { file, title, description, tags } = payload;
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error('Ukuran video maksimal 100MB');
  }

  const controller = new AbortController();
  uploadAbortControllers.set(taskId, controller);

  try {
    setTaskStatus(taskId, {
      status: 'creating-session',
      message: 'Membuat session upload...',
      totalChunks,
    });

    const createSessionRes = await apiClient.post<{
      sessionId: string;
      taskId: string;
      uploadedChunks: number[];
      uploadedBytes: number;
      totalChunks: number;
    }>('/videos/resumable/sessions', {
      clientTaskId: taskId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'video/mp4',
      totalChunks,
      chunkSize: CHUNK_SIZE,
      title,
      description,
      tags: tags || [],
    });

    const sessionId = createSessionRes.data.sessionId;
    let uploadedChunks = new Set<number>(createSessionRes.data.uploadedChunks || []);
    let uploadedBytes = createSessionRes.data.uploadedBytes || 0;

    setTaskStatus(taskId, {
      sessionId,
      status: 'uploading',
      message: 'Mengunggah video...',
      uploadedChunks: uploadedChunks.size,
      totalChunks,
      progress: Math.min(99, Math.round((uploadedBytes / file.size) * 100)),
    });

    const chunkIndexes: number[] = [];
    for (let index = 0; index < totalChunks; index += 1) {
      if (!uploadedChunks.has(index)) {
        chunkIndexes.push(index);
      }
    }

    let cursor = 0;
    const workers = Array.from({ length: Math.min(CHUNK_CONCURRENCY, chunkIndexes.length || 1) }).map(
      async () => {
        while (cursor < chunkIndexes.length) {
          const myIndex = chunkIndexes[cursor];
          cursor += 1;

          const start = myIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          await uploadChunkWithRetry(
            taskId,
            sessionId,
            myIndex,
            chunk,
            controller.signal,
          );

          uploadedChunks = new Set(uploadedChunks).add(myIndex);
          uploadedBytes += chunk.size;

          setTaskStatus(taskId, {
            status: 'uploading',
            uploadedChunks: uploadedChunks.size,
            totalChunks,
            progress: Math.min(99, Math.round((uploadedBytes / file.size) * 100)),
            message: `Mengunggah video... (${uploadedChunks.size}/${totalChunks} chunk)`,
          });
        }
      },
    );

    await Promise.all(workers);

    setTaskStatus(taskId, {
      status: 'processing',
      progress: 99,
      message: 'Upload selesai, mempublikasikan video...',
    });

    await apiClient.post(`/videos/resumable/sessions/${sessionId}/complete`, {
      title,
      description,
      tags: tags || [],
    });

    setTaskStatus(taskId, {
      status: 'completed',
      progress: 100,
      uploadedChunks: totalChunks,
      totalChunks,
      message:
        'Video berhasil diupload. Kualitas tinggi sedang dioptimalkan di background.',
      error: undefined,
    });
  } catch (error: unknown) {
    const message =
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { data?: { message?: string } } }).response
        ?.data?.message === 'string'
        ? (error as { response: { data: { message: string } } }).response.data
            .message
        : error instanceof Error
          ? error.message
          : 'Upload gagal diproses';

    setTaskStatus(taskId, {
      status: 'failed',
      progress: 0,
      error: message,
      message,
    });

    throw error;
  } finally {
    uploadAbortControllers.delete(taskId);
  }
};

export const useUploadTaskStore = create<UploadTaskState>((set, get) => ({
  tasks: [],

  startVideoUpload: async (input) => {
    const taskId = crypto.randomUUID();
    uploadTaskPayload.set(taskId, input);

    set((state) => ({
      tasks: [createTask(taskId, input.file), ...state.tasks],
    }));

    void runVideoUpload(taskId).catch(() => {
      // Error sudah di-set ke state agar bisa diretry dari global widget.
    });

    return taskId;
  },

  retryTask: async (taskId) => {
    const payload = uploadTaskPayload.get(taskId);
    if (!payload) {
      throw new Error('Data file upload tidak tersedia untuk retry.');
    }

    const existing = get().tasks.find((task) => task.id === taskId);
    if (!existing) {
      throw new Error('Task upload tidak ditemukan.');
    }

    setTaskStatus(taskId, {
      status: 'queued',
      progress: 0,
      uploadedChunks: 0,
      message: 'Mengulang upload...',
      error: undefined,
    });

    void runVideoUpload(taskId).catch(() => {
      // Error sudah di-set ke state agar bisa diretry lagi.
    });
  },

  cancelTask: async (taskId) => {
    const controller = uploadAbortControllers.get(taskId);
    if (controller) {
      controller.abort();
    }

    const task = get().tasks.find((item) => item.id === taskId);
    if (task?.sessionId) {
      try {
        await apiClient.delete(`/videos/resumable/sessions/${task.sessionId}`);
      } catch {
        // No-op: task tetap ditandai canceled di sisi client.
      }
    }

    setTaskStatus(taskId, {
      status: 'canceled',
      progress: 0,
      message: 'Upload dibatalkan',
      error: undefined,
    });
  },

  dismissTask: (taskId) => {
    uploadTaskPayload.delete(taskId);
    uploadAbortControllers.delete(taskId);

    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    }));
  },

  applyServerStatus: (payload) => {
    const existing = get().tasks.find((task) => task.id === payload.taskId);
    if (!existing) {
      return;
    }

    setTaskStatus(payload.taskId, {
      sessionId: payload.sessionId ?? existing.sessionId,
      status: payload.status ?? existing.status,
      progress:
        typeof payload.progress === 'number'
          ? payload.progress
          : existing.progress,
      uploadedChunks:
        typeof payload.uploadedChunks === 'number'
          ? payload.uploadedChunks
          : existing.uploadedChunks,
      totalChunks:
        typeof payload.totalChunks === 'number'
          ? payload.totalChunks
          : existing.totalChunks,
      message: payload.message ?? existing.message,
      error: payload.error,
      fileName: payload.fileName ?? existing.fileName,
      fileSize: payload.fileSize ?? existing.fileSize,
    });
  },
}));

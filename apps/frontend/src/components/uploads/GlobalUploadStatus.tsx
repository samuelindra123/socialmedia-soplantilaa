"use client";

import { useMemo } from 'react';
import { Loader2, RefreshCw, XCircle, CheckCircle2, Clock3, Trash2 } from 'lucide-react';
import { useUploadTaskStore } from '@/store/uploadTasks';

const statusLabel: Record<string, string> = {
  queued: 'Dalam antrian',
  'creating-session': 'Membuat session',
  uploading: 'Mengunggah',
  processing: 'Memproses',
  completed: 'Selesai',
  failed: 'Gagal',
  canceled: 'Dibatalkan',
};

export default function GlobalUploadStatus() {
  const tasks = useUploadTaskStore((state) => state.tasks);
  const retryTask = useUploadTaskStore((state) => state.retryTask);
  const cancelTask = useUploadTaskStore((state) => state.cancelTask);
  const dismissTask = useUploadTaskStore((state) => state.dismissTask);

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (task.status === 'completed') {
          const ageMs = Date.now() - new Date(task.updatedAt).getTime();
          return ageMs < 30_000;
        }
        return true;
      }),
    [tasks],
  );

  if (visibleTasks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[90] w-[min(92vw,360px)] space-y-2">
      {visibleTasks.map((task) => {
        const isRunning =
          task.status === 'uploading' ||
          task.status === 'creating-session' ||
          task.status === 'processing' ||
          task.status === 'queued';

        return (
          <div
            key={task.id}
            className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
          >
            <div className="flex items-start gap-2">
              <div className="pt-0.5">
                {isRunning && (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-indigo-400" />
                )}
                {task.status === 'failed' && (
                  <XCircle className="h-4 w-4 text-rose-500" />
                )}
                {task.status === 'completed' && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                {task.status === 'canceled' && (
                  <Clock3 className="h-4 w-4 text-slate-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {task.fileName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {statusLabel[task.status] || task.status}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {task.message}
                </p>
                {task.error && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                    {task.error}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-emerald-600 transition-all duration-300 dark:bg-emerald-400"
                style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                {task.uploadedChunks}/{task.totalChunks} chunk • {task.progress}%
              </span>
              <div className="flex items-center gap-2">
                {task.status === 'failed' && (
                  <button
                    onClick={() => void retryTask(task.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry
                  </button>
                )}
                {isRunning && (
                  <button
                    onClick={() => void cancelTask(task.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <XCircle className="h-3 w-3" /> Batal
                  </button>
                )}
                {(task.status === 'completed' ||
                  task.status === 'failed' ||
                  task.status === 'canceled') && (
                  <button
                    onClick={() => dismissTask(task.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="h-3 w-3" /> Tutup
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

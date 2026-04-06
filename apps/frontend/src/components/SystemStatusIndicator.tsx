"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";

type SimpleStatus = "ok" | "degraded" | "down" | "unknown";

interface SystemStatusResponse {
  status: SimpleStatus;
  timestamp: string;
  uptimeSec: number;
  environment: string;
  api: {
    latencyMs: number;
  };
  database: {
    status: "ok" | "degraded" | "down";
    latencyMs: number | null;
    error: string | null;
  };
}

async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  const res = await apiClient.get<SystemStatusResponse>("/system-status");
  return res.data;
}

export default function SystemStatusIndicator() {
  const [open, setOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery<SystemStatusResponse>({
    queryKey: ["system-status"],
    queryFn: fetchSystemStatus,
    enabled: open,
    refetchOnWindowFocus: false,
    staleTime: 15_000,
  });

  const overallStatus: SimpleStatus = data?.status ?? (isError ? "down" : "unknown");

  const isHealthy = overallStatus === "ok";
  const isDegraded = overallStatus === "degraded";

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !data && !isFetching) {
        void refetch();
      }
      return next;
    });
  };

  const label = isLoading && !data
    ? "Checking status..."
    : isHealthy
      ? "All systems normal"
      : isDegraded
        ? "Some systems degraded"
        : "Status unavailable";

  const dotColor = isHealthy
    ? "bg-emerald-500"
    : isDegraded
      ? "bg-amber-500"
      : "bg-slate-400";

  const pingColor = isHealthy
    ? "bg-emerald-400"
    : isDegraded
      ? "bg-amber-400"
      : "bg-slate-400";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full w-fit hover:border-slate-300 hover:bg-slate-100 transition-colors"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-75`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}
          />
        </span>
        <span className="text-[11px] font-medium text-slate-600 tracking-tight">
          {label}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40">
          <div className="w-full max-w-md sm:max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                {isHealthy ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>Status sistem</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 disabled:opacity-50"
                >
                  {isFetching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mb-4">
              Data diambil langsung dari sistem dan diperbarui secara berkala
              ketika jendela ini terbuka.
            </p>

            {isError && !data ? (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Tidak dapat mengambil status sistem saat ini.
              </p>
            ) : (
              <dl className="space-y-2 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <dt className="text-slate-500">API</dt>
                  <dd className="font-medium">
                    {data?.api?.latencyMs != null ? `${data.api.latencyMs} ms` : "-"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Database</dt>
                  <dd className="font-medium">
                    {data?.database.status === "ok"
                      ? "OK"
                      : data?.database.status === "down"
                        ? "Down"
                        : "Degraded"}
                    {data?.database.latencyMs != null &&
                      ` · ${data.database.latencyMs} ms`}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Uptime</dt>
                  <dd className="font-medium">
                    {data
                      ? `${Math.floor(data.uptimeSec / 60)}m ${data.uptimeSec % 60}s`
                      : "-"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Terakhir diperbarui</dt>
                  <dd className="font-medium">
                    {data
                      ? new Date(data.timestamp).toLocaleTimeString()
                      : "-"}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

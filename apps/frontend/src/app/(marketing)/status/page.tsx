'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, Wifi, Database, Server, Globe, Activity } from 'lucide-react';
import Link from 'next/link';

type Status = 'checking' | 'up' | 'down' | 'degraded';

interface ServiceStatus {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: Status;
  latency?: number;
  checkedAt?: Date;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  checking: { label: 'Memeriksa...', color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-400 animate-pulse' },
  up:       { label: 'Beroperasi Normal', color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500' },
  down:     { label: 'Tidak Dapat Diakses', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500 animate-pulse' },
  degraded: { label: 'Performa Menurun', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500 animate-pulse' },
};

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'API Server', description: 'Backend utama & autentikasi', icon: <Server className="w-5 h-5" />, status: 'checking' },
    { name: 'Database', description: 'PostgreSQL & penyimpanan data', icon: <Database className="w-5 h-5" />, status: 'checking' },
    { name: 'CDN & Media', description: 'Upload foto & video', icon: <Globe className="w-5 h-5" />, status: 'checking' },
    { name: 'Realtime (WebSocket)', description: 'Notifikasi & chat langsung', icon: <Wifi className="w-5 h-5" />, status: 'checking' },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const checkStatus = useCallback(async () => {
    setIsRefreshing(true);
    const now = new Date();

    // Check API server
    let apiStatus: Status = 'down';
    let apiLatency: number | undefined;
    try {
      const start = Date.now();
      const res = await fetch('/api/proxy/system-status', {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      apiLatency = Date.now() - start;
      if (res.ok) {
        apiStatus = apiLatency > 2000 ? 'degraded' : 'up';
      }
    } catch { apiStatus = 'down'; }

    // DB & realtime status derived from API response
    let dbStatus: Status = apiStatus === 'up' ? 'up' : 'down';
    let realtimeStatus: Status = apiStatus === 'up' ? 'up' : 'down';

    // Check CDN
    let cdnStatus: Status = 'down';
    try {
      const start = Date.now();
      await fetch('https://renunganku.sgp1.cdn.digitaloceanspaces.com/', {
        mode: 'no-cors',
        signal: AbortSignal.timeout(4000),
      });
      cdnStatus = Date.now() - start > 2000 ? 'degraded' : 'up';
    } catch { cdnStatus = 'down'; }

    setServices([
      { name: 'API Server', description: 'Backend utama & autentikasi', icon: <Server className="w-5 h-5" />, status: apiStatus, latency: apiLatency, checkedAt: now },
      { name: 'Database', description: 'PostgreSQL & penyimpanan data', icon: <Database className="w-5 h-5" />, status: dbStatus, checkedAt: now },
      { name: 'CDN & Media', description: 'Upload foto & video', icon: <Globe className="w-5 h-5" />, status: cdnStatus, checkedAt: now },
      { name: 'Realtime (WebSocket)', description: 'Notifikasi & chat langsung', icon: <Wifi className="w-5 h-5" />, status: realtimeStatus, checkedAt: now },
    ]);
    setLastChecked(now);
    setIsRefreshing(false);
    setCountdown(30);
  }, []);

  // Auto-check every 30s
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, [lastChecked]);

  const allUp = services.every(s => s.status === 'up');
  const anyDown = services.some(s => s.status === 'down');
  const overallStatus: Status = services[0]?.status === 'checking' ? 'checking' : anyDown ? 'down' : allUp ? 'up' : 'degraded';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
            ← Kembali ke Soplantila
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="w-4 h-4" />
            <span>Status Page</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Overall status */}
        <div className={`rounded-2xl p-6 border ${
          overallStatus === 'checking' ? 'bg-slate-50 border-slate-200' :
          overallStatus === 'up' ? 'bg-green-50 border-green-200' :
          overallStatus === 'degraded' ? 'bg-amber-50 border-amber-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              overallStatus === 'up' ? 'bg-green-100' :
              overallStatus === 'degraded' ? 'bg-amber-100' :
              overallStatus === 'checking' ? 'bg-slate-100' :
              'bg-red-100'
            }`}>
              {overallStatus === 'up' ? <CheckCircle className="w-6 h-6 text-green-600" /> :
               overallStatus === 'checking' ? <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" /> :
               <XCircle className={`w-6 h-6 ${overallStatus === 'degraded' ? 'text-amber-600' : 'text-red-600'}`} />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {overallStatus === 'checking' ? 'Memeriksa status...' :
                 overallStatus === 'up' ? 'Semua Sistem Beroperasi Normal' :
                 overallStatus === 'degraded' ? 'Beberapa Sistem Mengalami Gangguan' :
                 'Sistem Tidak Dapat Diakses'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {overallStatus === 'down' && 'Server sedang dalam maintenance atau perbaikan oleh tim samuelindrabastian.'}
                {overallStatus === 'up' && 'Semua layanan Soplantila berjalan normal.'}
                {overallStatus === 'degraded' && 'Beberapa layanan mengalami performa menurun.'}
                {overallStatus === 'checking' && 'Sedang memeriksa semua layanan...'}
              </p>
            </div>
          </div>
        </div>

        {/* Services */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Layanan</h2>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {services.map((service) => {
              const cfg = STATUS_CONFIG[service.status];
              return (
                <div key={service.name} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-slate-400 shrink-0">{service.icon}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{service.name}</p>
                      <p className="text-xs text-slate-400 truncate">{service.description}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${cfg.bg} ${cfg.color}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="hidden sm:inline">{cfg.label}</span>
                    {service.latency && <span className="text-slate-400 hidden sm:inline">· {service.latency}ms</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Auto-refresh info */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {lastChecked
                ? `Terakhir dicek: ${lastChecked.toLocaleTimeString('id-ID')}`
                : 'Memeriksa...'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs">Refresh otomatis dalam {countdown}s</span>
            <button
              onClick={checkStatus}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Cek Sekarang
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-200">
          Soplantila Status Page · Dikembangkan oleh{' '}
          <a href="https://www.samuelindrabastian.me/" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 font-medium">
            samuelindrabastian
          </a>
        </div>
      </div>
    </div>
  );
}

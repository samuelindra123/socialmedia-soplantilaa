'use client';

import { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';

const STORAGE_KEY = 'soplantila_maintenance_dismissed_v1';

export default function MaintenanceBanner() {
  const [serverDown, setServerDown] = useState<boolean | null>(null); // null = checking

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/proxy/system-status', {
          method: 'GET',
          cache: 'no-store',
          signal: AbortSignal.timeout(5000), // 5s timeout
        });
        setServerDown(!res.ok);
      } catch {
        setServerDown(true); // fetch failed = server down
      }
    };

    check();
  }, []);

  // Still checking or server is up → render nothing
  if (serverDown === null || serverDown === false) return null;

  const dismissed = typeof window !== 'undefined'
    ? sessionStorage.getItem(STORAGE_KEY)
    : '1';

  return <MaintenanceUI onDismiss={() => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    // Force re-render by reloading — simplest approach
    window.location.reload();
  }} showPopup={!dismissed} />;
}

function MaintenanceUI({ onDismiss, showPopup }: { onDismiss: () => void; showPopup: boolean }) {
  const [popupVisible, setPopupVisible] = useState(showPopup);

  return (
    <>
      {/* Permanent top banner */}
      <div className="relative z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2">
          <Wrench className="w-4 h-4 shrink-0 animate-pulse" />
          <span className="text-sm font-medium text-center">
            🚧 Server sedang tidak dapat diakses — Soplantila dalam pengembangan aktif oleh tim{' '}
            <strong>samuelindrabastian</strong>
          </span>
        </div>
      </div>

      {/* First-visit popup */}
      {popupVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-8 pb-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Wrench className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Server Tidak Dapat Diakses</h2>
              <p className="text-slate-400 text-sm">Soplantila Beta</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Platform dalam tahap beta</p>
                  <p className="text-amber-700 leading-relaxed">
                    Server API sedang tidak dapat diakses sementara. Tim sedang bekerja untuk memulihkannya.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>UI & desain sudah siap dinikmati</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Fitur sosial & feed dalam pengembangan</span>
                </div>
                <div className="flex items-start gap-2">
                  <Wrench className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Backend API sedang dioptimasi oleh tim</span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100 text-xs text-slate-400 text-center">
                Dikembangkan dengan ❤️ oleh{' '}
                <a
                  href="https://github.com/samuelindrabastian"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 font-medium hover:text-slate-900 inline-flex items-center gap-1"
                >
                  samuelindrabastian <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => { setPopupVisible(false); onDismiss(); }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Mengerti, Lanjutkan →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

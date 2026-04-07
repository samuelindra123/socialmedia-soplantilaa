'use client';

import { useState } from 'react';
import { Wrench, X, RefreshCw } from 'lucide-react';
import { useMaintenanceStatus } from '@/providers/maintenance-provider';

interface Props {
  children: React.ReactNode;
  action?: 'login' | 'signup' | 'reset';
}

const MESSAGES = {
  login: 'Login tidak dapat dilakukan saat ini karena server sedang maintenance.',
  signup: 'Pendaftaran akun baru tidak tersedia saat server sedang maintenance.',
  reset: 'Reset password tidak dapat dilakukan saat server sedang maintenance.',
};

export default function MaintenanceAuthGuard({ children, action = 'login' }: Props) {
  const { isServerDown } = useMaintenanceStatus();
  const [showWarning, setShowWarning] = useState(false);

  if (!isServerDown) return <>{children}</>;

  return (
    <>
      {/* Wrap children dengan overlay intercept */}
      <div className="relative">
        <div
          className="absolute inset-0 z-10 cursor-not-allowed"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowWarning(true); }}
        />
        <div className="opacity-50 pointer-events-none select-none">
          {children}
        </div>
      </div>

      {/* Warning toast */}
      {showWarning && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] w-full max-w-sm px-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Server Sedang Maintenance</p>
              <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">{MESSAGES[action]}</p>
              <div className="flex items-center gap-3 mt-2">
                <a href="/status" className="text-xs text-amber-400 font-medium hover:text-amber-300 underline">
                  Cek Status →
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>
            <button onClick={() => setShowWarning(false)} className="text-slate-400 hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { Wrench, AlertTriangle, ExternalLink, CheckCircle, Clock, Shield, RefreshCw } from 'lucide-react';
import { useMaintenanceStatus } from '@/providers/maintenance-provider';

const POPUP_KEY = 'soplantila_maintenance_popup_v1';

export default function MaintenanceBanner() {
  const { isServerDown } = useMaintenanceStatus();

  if (!isServerDown) return null;

  const alreadySeen = typeof window !== 'undefined' ? sessionStorage.getItem(POPUP_KEY) : '1';

  return <MaintenanceUI showPopup={!alreadySeen} />;
}

function MaintenanceUI({ showPopup }: { showPopup: boolean }) {
  const [popupVisible, setPopupVisible] = useState(showPopup);

  const dismiss = () => {
    sessionStorage.setItem(POPUP_KEY, '1');
    setPopupVisible(false);
  };

  return (
    <>
      {/* Banner — permanent, z-[60] above header z-50 */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-center">
          <div className="flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold">🚧 Maintenance Aktif</span>
            <span className="hidden sm:inline text-xs opacity-90">— Login & fitur sosial tidak dapat diakses.</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="sm:hidden opacity-90">Login tidak dapat diakses.</span>
            <a href="/status" className="underline font-bold hover:opacity-80">Cek Status →</a>
            <span className="opacity-60">·</span>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 underline font-medium hover:opacity-80"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh jika sudah pulih
            </button>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-9 sm:h-10 pointer-events-none" />

      {/* First-visit popup */}
      {popupVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 pt-7 pb-5 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Wrench className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Soplantila Sedang Maintenance</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Platform tidak dapat diakses sementara waktu</p>
            </div>

            <div className="px-5 sm:px-6 py-5 space-y-4">
              <div className="flex gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-800 mb-1">Akses Dibatasi Sementara</p>
                  <p className="text-red-700 leading-relaxed">
                    Kamu <strong>tidak dapat login, mendaftar, atau menggunakan fitur sosial</strong> selama maintenance berlangsung. Kami mohon maaf atas ketidaknyamanan ini.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status Saat Ini</p>
                {[
                  { icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: 'Halaman marketing & informasi dapat diakses' },
                  { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, text: <span>Login & pendaftaran akun <strong>tidak tersedia</strong></span> },
                  { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, text: <span>Feed, profil, dan fitur sosial <strong>tidak tersedia</strong></span> },
                  { icon: <Clock className="w-4 h-4 text-amber-500" />, text: 'Server API sedang diperbaiki & dioptimasi' },
                  { icon: <Shield className="w-4 h-4 text-blue-500" />, text: 'Data kamu aman, tidak ada yang hilang' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Hint refresh */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                <RefreshCw className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Jika server sudah pulih, <strong>refresh halaman</strong> untuk menghilangkan banner ini atau <a href="/status" className="underline font-semibold text-slate-800">cek status realtime</a>.</span>
              </div>

              <div className="pt-1 border-t border-slate-100 text-xs text-slate-400 text-center">
                Dikembangkan dengan ❤️ oleh{' '}
                <a href="https://www.samuelindrabastian.me/" target="_blank" rel="noopener noreferrer" className="text-slate-600 font-semibold hover:text-slate-900 inline-flex items-center gap-1">
                  samuelindrabastian <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-5">
              <button
                onClick={dismiss}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold rounded-xl transition-all text-sm"
              >
                Mengerti, Tutup Notifikasi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

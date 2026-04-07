'use client';

import { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, ExternalLink, CheckCircle, Clock, Shield } from 'lucide-react';

const POPUP_KEY = 'soplantila_maintenance_popup_v1';

export default function MaintenanceBanner() {
  const [serverDown, setServerDown] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/proxy/system-status', {
          method: 'GET',
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });
        setServerDown(!res.ok);
        if (!res.ok) document.documentElement.style.setProperty('--banner-height', '36px');
      } catch {
        setServerDown(true);
        document.documentElement.style.setProperty('--banner-height', '36px');
      }
    };
    check();
  }, []);

  if (serverDown === null || serverDown === false) return null;

  const alreadySeen = typeof window !== 'undefined'
    ? sessionStorage.getItem(POPUP_KEY)
    : '1';

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
      {/* Banner — z-[60] agar di atas header fixed z-50 */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 flex-wrap">
          <Wrench className="w-4 h-4 shrink-0 animate-pulse" />
          <p className="text-xs sm:text-sm font-medium text-center leading-snug">
            <span className="font-bold">🚧 Maintenance Aktif</span>
            {' — '}Server sedang dalam perbaikan oleh tim{' '}
            <span className="font-bold underline underline-offset-2">samuelindrabastian</span>.
            {' '}Login & fitur sosial <span className="font-bold">tidak dapat diakses</span>.{' '}
            <a href="/status" className="underline font-bold hover:opacity-80">Cek Status →</a>
          </p>
        </div>
      </div>

      {/* Spacer — mendorong seluruh konten (termasuk header fixed) ke bawah */}
      <div className="h-9 sm:h-10 relative z-[61]" />

      {/* Popup */}
      {popupVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 pt-7 pb-5 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Wrench className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Soplantila Sedang Maintenance</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Platform tidak dapat diakses sementara waktu</p>
            </div>

            {/* Body */}
            <div className="px-5 sm:px-6 py-5 space-y-4">
              {/* Warning utama */}
              <div className="flex gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-800 mb-1">Akses Dibatasi Sementara</p>
                  <p className="text-red-700 leading-relaxed">
                    Kamu <strong>tidak dapat login, mendaftar, atau menggunakan fitur sosial</strong> selama maintenance berlangsung. Kami mohon maaf atas ketidaknyamanan ini.
                  </p>
                </div>
              </div>

              {/* Status list */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status Saat Ini</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    <span>Halaman marketing & informasi dapat diakses</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Login & pendaftaran akun <strong>tidak tersedia</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Feed, profil, dan fitur sosial <strong>tidak tersedia</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Server API sedang diperbaiki & dioptimasi</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Data kamu aman, tidak ada yang hilang</span>
                  </div>
                </div>
              </div>

              {/* Credit */}
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 text-center">
                Dikembangkan dengan ❤️ oleh{' '}
                <a
                  href="https://www.samuelindrabastian.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 font-semibold hover:text-slate-900 inline-flex items-center gap-1"
                >
                  samuelindrabastian <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 pb-5">
              <button
                onClick={dismiss}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold rounded-xl transition-all text-sm"
              >
                Mengerti, Tutup Notifikasi
              </button>
              <div className="flex items-center justify-between mt-2 gap-2">
                <p className="text-xs text-slate-400">
                  Refresh halaman jika server sudah pulih
                </p>
                <a href="/status" className="text-xs text-slate-600 font-medium hover:text-slate-900 underline underline-offset-2 shrink-0">
                  Lihat Status →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

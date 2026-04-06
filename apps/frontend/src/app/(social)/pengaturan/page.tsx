"use client";

import { useEffect, useMemo, useState, ReactNode, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import SocialShell from "@/components/layouts/SocialShell";
import {
  Shield,
  Lock,
  Bell,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  WifiOff,
  Power,
  ExternalLink,
  RefreshCcw,
  Check,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import useAuthStore from "@/store/auth";
import type { SessionSummary } from "@/types";
import GoogleLogo from "@/components/auth/GoogleLogo";

interface SessionItem extends SessionSummary {
  isCurrent?: boolean;
  userAgent?: string | null;
  revokedAt?: string | null;
}

interface ChangePasswordPayload {
  newPassword: string;
  confirmPassword: string;
}

const fetchSessions = async () => {
  const { data } = await apiClient.get<SessionItem[]>("/auth/sessions");
  return data;
};

export default function PengaturanPage() {
  const queryClient = useQueryClient();
  const { user, checkAuth } = useAuthStore();
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
   const [isGoogleRedirecting, setGoogleRedirecting] = useState(false);

  const { data: sessions = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
    refetchInterval: 15000,
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.delete(`/auth/sessions/${sessionId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Sesi berhasil diputus");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Gagal memutus sesi";
      toast.error(message);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      apiClient.post("/auth/change-password", payload),
    onSuccess: () => {
      toast.success("Password diperbarui, semua sesi lain diputus");
      setPasswordModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Gagal memperbarui password";
      toast.error(message);
    },
  });

  const unlinkGoogleMutation = useMutation({
    mutationFn: () => apiClient.delete("/auth/google/unlink"),
    onSuccess: async () => {
      toast.success("Akun Google dilepas");
      await checkAuth();
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Gagal melepas Google";
      toast.error(message);
    },
  });

  const reportSuspiciousMutation = useMutation({
    mutationFn: () => apiClient.post('/auth/report-suspicious'),
    onSuccess: () => {
      toast.success('Laporan aktivitas mencurigakan dikirim ke email kamu');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Gagal mengirim laporan aktivitas';
      toast.error(message);
    },
  });

  const activeSessions = useMemo(() => sessions.filter((s) => !s.revokedAt), [sessions]);
  const currentSession = activeSessions.find((session) => session.isCurrent);
  const isGoogleConnected = Boolean(user?.googleId);

  const handleGoogleConnect = () => {
    if (isGoogleRedirecting) return;
    setGoogleRedirecting(true);
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent("/pengaturan")}&mode=link`;
  };

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const formatLastSeen = (value: string) => {
    const date = new Date(value);
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  return (
    <SocialShell
      mobileTitle="Pengaturan"
      mobileDescription="Kelola keamanan akun"
      disableDefaultContentPadding
      contentClassName="px-0 sm:px-4 md:px-8 lg:px-12 pt-6 pb-28 md:pb-10"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Keamanan</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Pengaturan & Proteksi Akun</h1>
            {isRefetching && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> memperbarui sesi...
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pantau perangkat terhubung, perbarui password, dan hubungkan login Google secara instan.
          </p>
          {user?.email && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Email utama akun: {' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{user.email}</span>
            </p>
          )}
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SecurityCard
            icon={<Shield className="h-4 w-4" />}
            title="Lapisan Proteksi"
            description="Verifikasi email dan OTP pemulihan aktif"
            status="Aktif"
            accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
          />
          <SecurityCard
            icon={<Bell className="h-4 w-4" />}
            title="Alert Login"
            description="Notif email ketika ada perangkat baru"
            status="Siaran"
            accent="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200"
          />
          <SecurityCard
            icon={<Smartphone className="h-4 w-4" />}
            title="Perangkat Terhubung"
            description={`${activeSessions.length} device aktif minggu ini`}
            status="Realtime"
            accent="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-emerald-600 dark:text-emerald-200" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Kredensial & Password</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ubah password tanpa meninggalkan halaman ini.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Password terakhir diperbarui</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{currentSession ? formatLastSeen(currentSession.createdAt) : "Belum pernah"}</p>
              <button
                onClick={() => setPasswordModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-black"
              >
                <Lock className="h-4 w-4" /> Perbarui password
              </button>
            </div>
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 p-4 flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
              Simpan kode cadangan OTP secara offline untuk pemulihan darurat.
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-200" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Perangkat & Sesi</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pantau semua perangkat yang terhubung.</p>
              </div>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-6 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Memuat sesi aktif...
                </div>
              ) : activeSessions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
                  <WifiOff className="h-5 w-5" />
                  Tidak ada sesi aktif lainnya.
                </div>
              ) : (
                activeSessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {session.deviceName || session.userAgent || "Perangkat tidak dikenal"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {session.ipAddress || "IP tidak diketahui"} · {formatLastSeen(session.lastSeen)}
                      </p>
                    </div>
                    {session.isCurrent ? (
                      <span className="text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 px-2 py-0.5 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Perangkat ini
                      </span>
                    ) : (
                      <button
                        onClick={() => revokeMutation.mutate(session.id)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-500"
                        disabled={revokeMutation.isPending}
                      >
                        {revokeMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                        Putuskan
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => refetch()}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Segarkan daftar perangkat
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <GoogleLogo className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Google OAuth</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isGoogleConnected
                    ? "Akun Google sudah terhubung untuk login instan."
                    : "Hubungkan Google agar login cukup satu ketukan."}
                </p>
                {isGoogleConnected && user?.email && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Tersambung sebagai <span className="font-semibold text-slate-700 dark:text-slate-200">{user.email}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {isGoogleConnected ? "Terhubung" : "Belum terhubung"}
                </p>
              </div>
              {isGoogleConnected ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleGoogleConnect}
                    disabled={isGoogleRedirecting}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-200 disabled:opacity-60"
                  >
                    {isGoogleRedirecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" />
                    )}
                    {isGoogleRedirecting ? "Mengarahkan..." : "Ganti akun"}
                  </button>
                  <button
                    onClick={() => unlinkGoogleMutation.mutate()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                    disabled={unlinkGoogleMutation.isPending}
                  >
                    {unlinkGoogleMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Power className="h-3.5 w-3.5" />
                    )}
                    Putuskan
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  disabled={isGoogleRedirecting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-black disabled:opacity-60"
                >
                  {isGoogleRedirecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleLogo className="h-4 w-4" />
                  )}
                  {isGoogleRedirecting ? "Mengarahkan..." : "Hubungkan Google"}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-200" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Laporkan Aktivitas Mencurigakan</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Laporkan ke tim keamanan jika kamu melihat tindakan tidak biasa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => reportSuspiciousMutation.mutate()}
                disabled={reportSuspiciousMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-6 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60"
              >
                {reportSuspiciousMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {reportSuspiciousMutation.isPending ? 'Mengirim...' : 'Kirim laporan'}
              </button>
            </div>
          </div>
        </section>
      </div>

      <ChangePasswordModal
        open={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSubmit={(payload) => changePasswordMutation.mutate(payload)}
        isLoading={changePasswordMutation.isPending}
      />
    </SocialShell>
  );
}

function SecurityCard({
  icon,
  title,
  description,
  status,
  accent,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-3">
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${accent}`}>
        {icon}
        {status}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function ChangePasswordModal({
  open,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ChangePasswordPayload) => void;
  isLoading: boolean;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Lengkapi password baru dan konfirmasi");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password belum sama");
      return;
    }
    onSubmit({ newPassword, confirmPassword });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Kredensial</p>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Perbarui Password</h3>
          </div>
          <button onClick={handleClose} className="text-sm text-slate-500 hover:text-slate-900">Tutup</button>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Password baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              placeholder="Minimal 8 karakter"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Konfirmasi password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              placeholder="Ulangi password"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={handleClose}
              disabled={isLoading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Simpan password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

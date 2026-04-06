"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import useAuthStore from "@/store/auth";
import { confirmGoogleAction } from "@/app/actions/auth-actions";

function GoogleConsentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = searchParams.get("email");
  const googleId = searchParams.get("googleId");
  const name = searchParams.get("name") || "Pengguna Google";
  const redirect = searchParams.get("redirect") || "/feed";

  useEffect(() => {
    if (!email || !googleId) {
      const id = requestAnimationFrame(() => {
        toast.error("Data Google tidak lengkap, silakan coba lagi.");
        router.replace("/login");
      });
      return () => cancelAnimationFrame(id);
    }
  }, [email, googleId, router]);

  const handleCancel = () => {
    router.replace("/login");
  };

  const handleConfirm = async () => {
    if (!email || !googleId) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Membuat akun dari Google...");

    try {
      const result = await confirmGoogleAction(email, googleId, name);

      if (!result.ok) {
        throw new Error(result.message);
      }

      const token = result.accessToken;
      const sessionToken = result.sessionToken ?? undefined;

      if (!token || !sessionToken) {
        throw new Error("Token tidak lengkap dari server");
      }

      await useAuthStore.getState().checkAuth();
      toast.success("Akun Google berhasil dikonfirmasi", { id: toastId });
      router.replace(redirect);
    } catch (error) {
      console.error(error);
      const raw =
        (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message;
      const friendly =
        typeof raw === "string"
          ? raw
          : "Gagal mengonfirmasi akun Google. Coba lagi nanti.";
      toast.error(friendly, { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
              alt="Google"
              className="h-6 w-6"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Google Login
            </p>
            <h1 className="text-xl font-semibold text-slate-900">
              Konfirmasi akun Google kamu
            </h1>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Kamu akan menggunakan akun Google berikut sebagai akun default di
            sosial media <span className="font-semibold">Renunganku</span>:
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">Akun Google</p>
            <p className="text-sm font-semibold text-slate-900">{name}</p>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
          <p className="text-xs text-slate-500">
            Apakah Anda ingin menjadikan akun Google ini sebagai akun default di
            sosial media Renunganku?
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Setuju
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GoogleConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <p className="text-sm text-slate-600 font-medium">Menyiapkan halaman konfirmasi Google...</p>
          </div>
        </div>
      }
    >
      <GoogleConsentContent />
    </Suspense>
  );
}

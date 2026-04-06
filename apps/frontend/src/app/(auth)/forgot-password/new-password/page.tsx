"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { forgotPasswordResetAction } from "@/app/actions/auth-actions";

const schema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof schema>;

export default function ForgotPasswordNewPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = sessionStorage.getItem("reset_token");
    const storedEmail = sessionStorage.getItem("reset_email");
    if (!storedToken || !storedEmail) {
      router.replace("/forgot-password");
      return;
    }
    const id = requestAnimationFrame(() => {
      setToken(storedToken);
      setEmail(storedEmail);
    });
    return () => cancelAnimationFrame(id);
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: ResetForm) => {
    if (!token) return;
    setServerError(null);
    const toastId = toast.loading("Memperbarui password...");
    try {
      const result = await forgotPasswordResetAction(token, values.password);
      if (!result.ok) {
        throw new Error(result.message);
      }
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("reset_token");
        sessionStorage.removeItem("reset_email");
      }
      toast.success("Password berhasil diperbarui", { id: toastId });
      router.push("/login");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        (err instanceof Error ? err.message : "Gagal memperbarui password");
      setServerError(message);
      toast.error(message, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-white dark:bg-slate-950">
      <div className="flex flex-col px-6 md:px-12 lg:px-20 py-10">
        <div className="mb-10">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <Logo variant="full" height={32} />
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Password Baru</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2 mb-2">
              Buat password baru
            </h1>
            {email && (
              <p className="text-sm text-slate-500">
                Akun: <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
              </p>
            )}
          </div>

          {serverError && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Password baru
              </label>
              <div className="relative">
                <input
                  type="password"
                  {...register("password")}
                  placeholder="Minimal 8 karakter"
                  className={`w-full rounded-2xl border bg-white px-12 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:bg-slate-900 dark:text-white ${
                    errors.password ? "border-red-300 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Konfirmasi password
              </label>
              <div className="relative">
                <input
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="Ulangi password baru"
                  className={`w-full rounded-2xl border bg-white px-12 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:bg-slate-900 dark:text-white ${
                    errors.confirmPassword ? "border-red-300 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Perbarui password"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Ingat password Anda?{' '}
            <Link href="/login" className="font-semibold text-slate-900 hover:underline">
              Kembali ke login
            </Link>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.4em] text-slate-400">
          <ShieldCheck className="h-3 w-3" />
          <span>Perlindungan akun</span>
        </div>
      </div>

      <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-700 via-slate-900 to-slate-950 lg:flex">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div className="relative z-10 max-w-md text-center text-white">
          <p className="text-2xl font-semibold mb-4">
            &ldquo;Langkah kecil untuk mengganti password hari ini adalah investasi keamanan untuk masa depan.&rdquo;
          </p>
          <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/80">
            Renunganku Care
          </span>
        </div>
      </div>
    </div>
  );
}

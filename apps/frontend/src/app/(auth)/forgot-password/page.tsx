"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Mail, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { forgotPasswordRequestAction } from "@/app/actions/auth-actions";

const schema = z.object({
  email: z.string().email("Format email tidak valid"),
});

type ForgotForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ForgotForm) => {
    setServerError(null);
    const toastId = toast.loading("Memeriksa email...");
    try {
      const result = await forgotPasswordRequestAction(data.email);
      if (!result.ok) {
        throw new Error(result.message);
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("reset_email", data.email);
        sessionStorage.removeItem("reset_token");
      }
      toast.success("Kode OTP dikirim ke email Anda", { id: toastId });
      router.push("/forgot-password/otp");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        (err instanceof Error ? err.message : "Gagal memproses permintaan");
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
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Reset Password</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2 mb-2">
              Lupa password?
            </h1>
            <p className="text-sm text-slate-500">
              Masukkan email akun Anda dan kami akan mengirimkan kode OTP 6 digit untuk memulai proses pengaturan ulang password.
            </p>
          </div>

          {serverError && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Email terdaftar
              </label>
              <div className="relative">
                <input
                  type="email"
                  {...register("email")}
                  placeholder="nama@email.com"
                  className={`w-full rounded-2xl border bg-white px-12 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:bg-slate-900 dark:text-white ${
                    errors.email ? "border-red-300 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Kirim kode OTP
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
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
          <span>Keamanan verified</span>
        </div>
      </div>

      <div className="relative hidden items-center justify-center overflow-hidden bg-slate-950 lg:flex">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 max-w-md text-center">
          <p className="text-2xl font-semibold text-white mb-4">
            &ldquo;Setiap hari baru adalah kesempatan untuk memulai perjalanan Anda dari awal.&rdquo;
          </p>
          <span className="rounded-full border border-white/10 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/70">
            Renunganku
          </span>
        </div>
      </div>
    </div>
  );
}
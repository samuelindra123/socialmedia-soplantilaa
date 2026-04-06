"use server";

import { cookies, headers } from "next/headers";
import type { LoginResponse, User } from "@/types";
import { buildBackendUrl } from "@/lib/server/backend-url";
import {
  getInternalApiToken,
  INTERNAL_API_TOKEN_HEADER,
} from "@/lib/server/internal-api-token";

type FailedResult = {
  ok: false;
  message: string;
  status: number;
};

type LoginResult =
  | {
      ok: true;
      user: User;
      accessToken: string;
      sessionToken: string | null;
    }
  | FailedResult;

type RegisterResult =
  | {
      ok: true;
      message: string;
      userId: string;
    }
  | FailedResult;

type MessageOnlyResult =
  | {
      ok: true;
      message: string;
    }
  | FailedResult;

type VerifyOtpResult =
  | {
      ok: true;
      message: string;
      resetToken: string;
    }
  | FailedResult;

type JsonResult<T> =
  | {
      ok: true;
      status: number;
      data: T;
    }
  | FailedResult;

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const value = (payload as { message?: unknown }).message;

  if (Array.isArray(value)) {
    const onlyStrings = value.filter((entry): entry is string => typeof entry === "string");
    if (onlyStrings.length > 0) return onlyStrings.join(" • ");
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return fallback;
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<JsonResult<T>> {
  try {
    const internalToken = getInternalApiToken();

    const response = await fetch(buildBackendUrl(path), {
      ...init,
      cache: "no-store",
      redirect: "follow",
      headers: {
        "content-type": "application/json",
        [INTERNAL_API_TOKEN_HEADER]: internalToken,
        ...(init.headers || {}),
      },
    });

    const payload = (await response.json().catch(() => ({}))) as unknown;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: getErrorMessage(payload, fallbackMessage),
      };
    }

    return {
      ok: true,
      status: response.status,
      data: payload as T,
    };
  } catch {
    return {
      ok: false,
      status: 500,
      message: "Gagal terhubung ke server",
    };
  }
}

async function setAuthCookies(accessToken: string, sessionToken?: string | null) {
  const cookieStore = await cookies();

  cookieStore.set("token", accessToken, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });

  if (sessionToken) {
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });
  }
}

export async function clearAuthCookiesAction(): Promise<{ ok: true }> {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("session_token");
  return { ok: true };
}

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") || "renunganku-web";

  const result = await requestJson<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      headers: {
        "user-agent": userAgent,
      },
      body: JSON.stringify({ email, password }),
    },
    "Email atau password salah",
  );

  if (!result.ok) return result;

  await setAuthCookies(result.data.accessToken, result.data.session?.token ?? null);

  return {
    ok: true,
    user: result.data.user,
    accessToken: result.data.accessToken,
    sessionToken: result.data.session?.token ?? null,
  };
}

export async function registerAction(
  fullName: string,
  email: string,
  password: string,
): Promise<RegisterResult> {
  const result = await requestJson<{ message: string; userId: string }>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        namaLengkap: fullName,
      }),
    },
    "Terjadi kesalahan saat mendaftar",
  );

  if (!result.ok) return result;

  return {
    ok: true,
    message: result.data.message,
    userId: result.data.userId,
  };
}

export async function verifyEmailTokenAction(token: string): Promise<LoginResult> {
  const result = await requestJson<{ message: string; accessToken: string }>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    },
    "Link verifikasi tidak valid atau sudah kadaluarsa",
  );

  if (!result.ok) return result;

  await setAuthCookies(result.data.accessToken, null);

  return {
    ok: true,
    user: {
      id: "",
      email: "",
      namaLengkap: "",
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    },
    accessToken: result.data.accessToken,
    sessionToken: null,
  };
}

export async function verifyEmailOtpAction(userId: string, otp: string): Promise<LoginResult> {
  const result = await requestJson<{ message: string; accessToken: string }>(
    `/auth/verify-otp/${encodeURIComponent(userId)}`,
    {
      method: "POST",
      body: JSON.stringify({ otp }),
    },
    "Terjadi kesalahan saat verifikasi",
  );

  if (!result.ok) return result;

  await setAuthCookies(result.data.accessToken, null);

  return {
    ok: true,
    user: {
      id: "",
      email: "",
      namaLengkap: "",
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    },
    accessToken: result.data.accessToken,
    sessionToken: null,
  };
}

export async function resendVerificationAction(email: string): Promise<MessageOnlyResult> {
  const result = await requestJson<{ message: string }>(
    "/auth/resend-verification",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    "Gagal mengirim ulang kode",
  );

  if (!result.ok) return result;

  return {
    ok: true,
    message: result.data.message,
  };
}

export async function forgotPasswordRequestAction(email: string): Promise<MessageOnlyResult> {
  const result = await requestJson<{ message: string }>(
    "/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    "Gagal memproses permintaan",
  );

  if (!result.ok) return result;

  return {
    ok: true,
    message: result.data.message,
  };
}

export async function forgotPasswordVerifyOtpAction(
  email: string,
  otp: string,
): Promise<VerifyOtpResult> {
  const result = await requestJson<{ message: string; resetToken: string }>(
    "/auth/forgot-password/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    },
    "OTP tidak valid",
  );

  if (!result.ok) return result;

  return {
    ok: true,
    message: result.data.message,
    resetToken: result.data.resetToken,
  };
}

export async function forgotPasswordResetAction(
  token: string,
  password: string,
): Promise<MessageOnlyResult> {
  const result = await requestJson<{ message: string }>(
    "/auth/forgot-password/reset",
    {
      method: "POST",
      body: JSON.stringify({ token, password }),
    },
    "Gagal memperbarui password",
  );

  if (!result.ok) return result;

  return {
    ok: true,
    message: result.data.message,
  };
}

export async function confirmGoogleAction(
  email: string,
  googleId: string,
  displayName: string,
): Promise<LoginResult> {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") || "renunganku-web";

  const result = await requestJson<LoginResponse>(
    "/auth/google/confirm",
    {
      method: "POST",
      headers: {
        "user-agent": userAgent,
      },
      body: JSON.stringify({
        email,
        googleId,
        displayName,
      }),
    },
    "Gagal mengonfirmasi akun Google",
  );

  if (!result.ok) return result;

  await setAuthCookies(result.data.accessToken, result.data.session?.token ?? null);

  return {
    ok: true,
    user: result.data.user,
    accessToken: result.data.accessToken,
    sessionToken: result.data.session?.token ?? null,
  };
}

export async function completeOAuthSessionAction(
  accessToken: string,
  sessionToken: string,
): Promise<MessageOnlyResult> {
  if (!accessToken || !sessionToken) {
    return {
      ok: false,
      status: 400,
      message: "Token OAuth tidak lengkap",
    };
  }

  await setAuthCookies(accessToken, sessionToken);

  return {
    ok: true,
    message: "Sesi OAuth berhasil diamankan",
  };
}

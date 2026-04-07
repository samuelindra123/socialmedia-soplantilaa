import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/server/backend-url";
import {
  getInternalApiToken,
  INTERNAL_API_TOKEN_HEADER,
} from "@/lib/server/internal-api-token";

const ALLOWED_MODES = new Set(["login", "signup", "link"]);

function normalizeMode(raw: string | null): "login" | "signup" | "link" {
  if (raw && ALLOWED_MODES.has(raw)) {
    return raw as "login" | "signup" | "link";
  }
  return "login";
}

function normalizeRedirectPath(raw: string | null, mode: "login" | "signup" | "link"): string {
  const fallback = mode === "link" ? "/pengaturan" : "/feed";
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

export async function GET(request: NextRequest) {
  const mode = normalizeMode(request.nextUrl.searchParams.get("mode"));
  const redirectPath = normalizeRedirectPath(request.nextUrl.searchParams.get("redirect"), mode);

  const authUrl = new URL(buildBackendUrl("/auth/google"));
  authUrl.searchParams.set("mode", mode);
  authUrl.searchParams.set("redirect", redirectPath);

  try {
    const internalToken = getInternalApiToken();

    const upstream = await fetch(authUrl.toString(), {
      method: "GET",
      redirect: "manual",
      headers: {
        "user-agent": request.headers.get("user-agent") || "soplantila-web",
        [INTERNAL_API_TOKEN_HEADER]: internalToken,
      },
      cache: "no-store",
    });

    const location = upstream.headers.get("location");

    if (location) {
      return NextResponse.redirect(location, { status: 302 });
    }
  } catch {
    // continue to error redirect below
  }

  const fallbackPath =
    mode === "link" ? "/pengaturan" : mode === "signup" ? "/signup" : "/login";
  const fallbackUrl = new URL(fallbackPath, request.url);
  fallbackUrl.searchParams.set("error", "google_oauth_unavailable");
  return NextResponse.redirect(fallbackUrl, { status: 302 });
}

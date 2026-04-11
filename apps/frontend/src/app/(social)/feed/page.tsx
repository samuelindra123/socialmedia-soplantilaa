import { cookies } from "next/headers";
import FeedPageClient from "./FeedPageClient";
import type { PaginatedResponse, Post, User } from "@/types";
import { buildBackendUrl } from "@/lib/server/backend-url";
import {
  getInternalApiToken,
  INTERNAL_API_TOKEN_HEADER,
} from "@/lib/server/internal-api-token";

export const dynamic = "force-dynamic";

function buildInternalHeaders(cookieStore: Awaited<ReturnType<typeof cookies>>): HeadersInit {
  const headers: Record<string, string> = {};
  const accessToken = cookieStore.get("token")?.value;
  const sessionToken = cookieStore.get("session_token")?.value;

  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  if (sessionToken) {
    headers["x-session-token"] = sessionToken;
  }

  try {
    headers[INTERNAL_API_TOKEN_HEADER] = getInternalApiToken();
  } catch {
    // Ignore when token is unavailable in local/dev environments.
  }

  return headers;
}

async function fetchJson<T>(pathname: string, headers: HeadersInit): Promise<T | null> {
  try {
    const response = await fetch(buildBackendUrl(pathname), {
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default async function FeedPage() {
  const cookieStore = await cookies();
  const headers = buildInternalHeaders(cookieStore);
  const initialUser = await fetchJson<User>("/users/profile", headers);
  const initialFeedData =
    initialUser?.profile?.isOnboardingComplete
      ? await fetchJson<PaginatedResponse<Post>>("/posts/feed?mode=following", headers)
      : null;

  return (
    <FeedPageClient
      initialUser={initialUser}
      initialFeedData={initialFeedData}
    />
  );
}

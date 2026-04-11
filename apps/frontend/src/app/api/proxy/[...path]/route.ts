import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/server/backend-url";
import {
  getInternalApiToken,
  INTERNAL_API_TOKEN_HEADER,
} from "@/lib/server/internal-api-token";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (
    error.name === "AbortError" ||
    error.message.includes("aborted") ||
    error.message.includes("ECONNRESET")
  );
}

function buildTargetUrl(request: NextRequest, path: string[]): string {
  const joinedPath = path.join("/");
  const target = new URL(buildBackendUrl(`/${joinedPath}`));

  request.nextUrl.searchParams.forEach((value, key) => {
    if (key === "path") return; // strip catch-all route artifact
    target.searchParams.append(key, value);
  });

  return target.toString();
}

function buildForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();

    if (
      lower === "host" ||
      lower === "connection" ||
      lower === "content-length" ||
      lower === "accept-encoding" ||
      lower === "cookie" ||
      lower === "authorization" ||
      lower === INTERNAL_API_TOKEN_HEADER
    ) {
      return;
    }

    headers.set(key, value);
  });

  const accessToken = request.cookies.get("token")?.value;
  const sessionToken = request.cookies.get("session_token")?.value;

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  if (sessionToken) {
    headers.set("x-session-token", sessionToken);
  }

  headers.set(INTERNAL_API_TOKEN_HEADER, getInternalApiToken());

  headers.set("x-forwarded-host", request.headers.get("host") || "");
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  return headers;
}

async function proxyHandler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  try {
    const { path } = await context.params;

    if (!Array.isArray(path) || path.length === 0) {
      return NextResponse.json({ message: "Path API tidak valid" }, { status: 400 });
    }

    const targetUrl = buildTargetUrl(request, path);
    const headers = buildForwardHeaders(request);

    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer();

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: request.signal,
    });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");

    if (contentType) {
      responseHeaders.set("content-type", contentType);
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    if (isAbortError(error)) {
      return new NextResponse(null, { status: 204 });
    }

    throw error;
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const PATCH = proxyHandler;
export const DELETE = proxyHandler;
export const OPTIONS = proxyHandler;

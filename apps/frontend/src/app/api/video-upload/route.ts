import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/server/backend-url";
import {
  getInternalApiToken,
  INTERNAL_API_TOKEN_HEADER,
} from "@/lib/server/internal-api-token";

// Node.js runtime — no body size limit (edge runtime caps at 4MB)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const headers = new Headers();

    const accessToken = request.cookies.get("token")?.value;
    const sessionToken = request.cookies.get("session_token")?.value;
    if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
    if (sessionToken) headers.set("x-session-token", sessionToken);
    headers.set(INTERNAL_API_TOKEN_HEADER, getInternalApiToken());

    // Forward multipart/form-data as-is (video + thumbnail fields)
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    const body = await request.arrayBuffer();

    const upstream = await fetch(buildBackendUrl("/videos/upload"), {
      method: "POST",
      headers,
      body,
    });

    const responseData = await upstream.json();
    return NextResponse.json(responseData, { status: upstream.status });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}

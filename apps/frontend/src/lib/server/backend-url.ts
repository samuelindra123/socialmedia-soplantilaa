const DEFAULT_BACKEND_URL = "http://localhost:4000";

export const BACKEND_API_URL = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  DEFAULT_BACKEND_URL
).replace(/\/$/, "");

export function buildBackendUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${BACKEND_API_URL}${normalizedPath}`;
}

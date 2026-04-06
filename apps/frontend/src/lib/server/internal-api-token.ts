export const INTERNAL_API_TOKEN_HEADER = "x-internal-api-token";

export function getInternalApiToken(): string {
  const token = process.env.NEXT_SERVER_ACTION_API_TOKEN;

  if (!token) {
    throw new Error(
      "NEXT_SERVER_ACTION_API_TOKEN belum dikonfigurasi di frontend server",
    );
  }

  return token;
}
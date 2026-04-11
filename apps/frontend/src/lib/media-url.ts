import { resolveSocketBaseUrl } from '@/lib/socket-url';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      try {
        const parsed = new URL(trimmed);
        const isLocalHost = LOCAL_HOSTS.has(parsed.hostname);
        if (!isLocalHost && parsed.protocol === 'http:') {
          parsed.protocol = 'https:';
          return parsed.toString();
        }
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}${trimmed}`;
    }

    return `https:${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    const base = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_ASSET_BASE_URL || process.env.NEXT_PUBLIC_API_URL);
    return `${base}${trimmed}`;
  }

  if (trimmed.includes('.')) {
    return `https://${trimmed}`;
  }

  return '';
}

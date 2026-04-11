const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function getSafeFallbackUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:4000';
}

function normalizeBasePath(pathname: string) {
  const withoutApiSuffix = pathname.replace(/\/?api\/?$/, '');
  if (!withoutApiSuffix || withoutApiSuffix === '/') {
    return '';
  }

  return withoutApiSuffix.replace(/\/$/, '');
}

export function resolveSocketBaseUrl(rawEnvUrl?: string) {
  const fallback = getSafeFallbackUrl();
  const envValue = rawEnvUrl?.trim();

  let resolved = fallback;
  try {
    const parsed = new URL(envValue || fallback);

    if (typeof window !== 'undefined') {
      const browserHost = window.location.hostname;
      const envIsLocal = LOCAL_HOSTS.has(parsed.hostname);
      const browserIsLocal = LOCAL_HOSTS.has(browserHost);

      if (envIsLocal && !browserIsLocal) {
        const protocol =
          window.location.protocol === 'https:'
            ? 'https:'
            : parsed.protocol;
        const port = parsed.port || '4000';
        const basePath = normalizeBasePath(parsed.pathname);

        return `${protocol}//${browserHost}:${port}${basePath}`;
      }

      if (window.location.protocol === 'https:' && parsed.protocol === 'http:') {
        parsed.protocol = 'https:';
      }
    }

    const basePath = normalizeBasePath(parsed.pathname);
    resolved = `${parsed.origin}${basePath}`;
  } catch {
    resolved = fallback;
  }

  return resolved;
}

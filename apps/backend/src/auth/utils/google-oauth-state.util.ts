import { createHmac, timingSafeEqual } from 'crypto';

export type GoogleOauthMode = 'login' | 'signup' | 'link';

const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

interface GoogleOauthStatePayload {
  redirect: string;
  mode: GoogleOauthMode;
  iat: number;
}

function normalizeMode(raw: unknown): GoogleOauthMode {
  if (raw === 'signup' || raw === 'link' || raw === 'login') {
    return raw;
  }
  return 'login';
}

function normalizeRedirectPath(raw: unknown, mode: GoogleOauthMode): string {
  const fallback = mode === 'link' ? '/pengaturan' : '/feed';
  if (typeof raw !== 'string' || !raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  return raw;
}

function signState(payloadBase64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadBase64).digest('base64url');
}

export function createSignedGoogleOauthState(
  secret: string,
  rawRedirect: unknown,
  rawMode: unknown,
): string {
  const mode = normalizeMode(rawMode);
  const payload: GoogleOauthStatePayload = {
    mode,
    redirect: normalizeRedirectPath(rawRedirect, mode),
    iat: Date.now(),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url',
  );
  const signature = signState(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

export function verifySignedGoogleOauthState(
  secret: string,
  stateParam: unknown,
): { redirect: string; mode: GoogleOauthMode } | null {
  if (typeof stateParam !== 'string' || !stateParam.includes('.')) {
    return null;
  }

  const [payloadBase64, signature] = stateParam.split('.', 2);
  if (!payloadBase64 || !signature) {
    return null;
  }

  const expectedSignature = signState(payloadBase64, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8'),
    ) as Partial<GoogleOauthStatePayload>;

    if (typeof parsed.iat !== 'number') {
      return null;
    }

    if (Date.now() - parsed.iat > OAUTH_STATE_MAX_AGE_MS) {
      return null;
    }

    const mode = normalizeMode(parsed.mode);
    const redirect = normalizeRedirectPath(parsed.redirect, mode);

    return { mode, redirect };
  } catch {
    return null;
  }
}

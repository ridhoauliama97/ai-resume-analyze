import { createHmac, randomBytes } from 'node:crypto';

export const CLIENT_COOKIE = 'ra_client';

export function createClientToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashClientToken(token: string, pepper: string): string {
  return createHmac('sha256', pepper).update(token).digest('hex');
}

export function readClientToken(request: Request): string | null {
  const header = request.headers.get('cookie');
  if (!header) {
    return null;
  }

  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === CLIENT_COOKIE) {
      const value = rest.join('=').trim();
      return value.length > 0 ? value : null;
    }
  }

  return null;
}

export function clientCookieOptions(secure: boolean): {
  httpOnly: boolean;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  };
}

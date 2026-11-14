import { createHmac, timingSafeEqual } from 'node:crypto';
import { connection } from 'next/server';
import { cookies } from 'next/headers';
import { getServerEnv } from '@/lib/env';

export const ADMIN_COOKIE = 'ra_admin';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function getSecret(): string {
  try {
    return getServerEnv().CLIENT_TOKEN_PEPPER;
  } catch {
    return process.env.CLIENT_TOKEN_PEPPER || 'dev-admin-secret';
  }
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createAdminSession(username: string): string {
  const expiry = Date.now() + SESSION_DURATION_MS;
  const payload = `${username}:${expiry}`;
  return `${payload}:${sign(payload)}`;
}

export function verifyAdminSession(cookie: string | undefined): boolean {
  if (!cookie) {
    return false;
  }

  const separatorIndex = cookie.lastIndexOf(':');
  if (separatorIndex < 0) {
    return false;
  }

  const payload = cookie.slice(0, separatorIndex);
  const signature = cookie.slice(separatorIndex + 1);
  const [username, expiryRaw] = payload.split(':');

  if (!username || !expiryRaw) {
    return false;
  }

  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || Date.now() > expiry) {
    return false;
  }

  const expected = sign(payload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function getCurrentAdmin(): Promise<string | null> {
  await connection();
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(cookie)) {
    return null;
  }

  const payload = cookie!.slice(0, cookie!.lastIndexOf(':'));
  return payload.split(':')[0] || null;
}

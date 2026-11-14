import { NextResponse } from 'next/server';
import { z } from 'zod';
import { timingSafeEqual } from 'node:crypto';
import { ADMIN_COOKIE, createAdminSession } from '@/lib/auth/admin';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type AdminAuthDeps = {
  username: string;
  password: string;
  secureCookies: boolean;
};

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function handleAdminLogin(
  request: Request,
  deps: AdminAuthDeps,
): Promise<NextResponse> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return errorResponse(400, 'invalid_body', 'Permintaan login tidak valid.');
  }

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, 'invalid_credentials', 'Username dan password wajib diisi.');
  }

  if (
    !safeCompare(parsed.data.username, deps.username) ||
    !safeCompare(parsed.data.password, deps.password)
  ) {
    return errorResponse(401, 'invalid_credentials', 'Username atau password salah.');
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(parsed.data.username), {
    httpOnly: true,
    sameSite: 'lax',
    secure: deps.secureCookies,
    path: '/',
    maxAge: 8 * 60 * 60,
  });

  return response;
}

export function handleAdminLogout(request: Request, secureCookies: boolean): NextResponse {
  const response = NextResponse.redirect(new URL('/', request.url), 303);
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies,
    path: '/',
    maxAge: 0,
  });

  return response;
}

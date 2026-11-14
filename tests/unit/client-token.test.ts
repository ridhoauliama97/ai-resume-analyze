import { expect, test } from 'vitest';
import {
  CLIENT_COOKIE,
  clientCookieOptions,
  createClientToken,
  hashClientToken,
  readClientToken,
} from '@/lib/auth/client-token';

test('createClientToken returns a 43-char base64url token and is random', () => {
  const first = createClientToken();
  const second = createClientToken();

  expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(first).not.toBe(second);
});

test('hashClientToken is deterministic, 64 hex, and pepper-dependent', () => {
  const token = 'token-123';

  expect(hashClientToken(token, 'pepper-a')).toBe(hashClientToken(token, 'pepper-a'));
  expect(hashClientToken(token, 'pepper-a')).toMatch(/^[0-9a-f]{64}$/);
  expect(hashClientToken(token, 'pepper-a')).not.toBe(hashClientToken(token, 'pepper-b'));
});

test('readClientToken finds the token in the middle of the cookie header', () => {
  const request = new Request('http://localhost/', {
    headers: { cookie: `theme=dark; ${CLIENT_COOKIE}=abc123; other=1` },
  });

  expect(readClientToken(request)).toBe('abc123');
});

test('readClientToken returns null when the cookie is absent', () => {
  const request = new Request('http://localhost/', {
    headers: { cookie: 'theme=dark' },
  });

  expect(readClientToken(request)).toBeNull();
  expect(readClientToken(new Request('http://localhost/'))).toBeNull();
});

test('clientCookieOptions disables JS access and sets a one-year lifetime', () => {
  expect(clientCookieOptions(true)).toEqual({
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  expect(clientCookieOptions(false).secure).toBe(false);
});

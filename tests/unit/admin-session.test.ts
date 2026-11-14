import { expect, test } from 'vitest';
import { createAdminSession, verifyAdminSession } from '@/lib/auth/admin';

test('creates a verifiable admin session', () => {
  const cookie = createAdminSession('admin');

  expect(verifyAdminSession(cookie)).toBe(true);
});

test('rejects tampered, malformed, and missing cookies', () => {
  const cookie = createAdminSession('admin');

  expect(verifyAdminSession(`${cookie}x`)).toBe(false);
  expect(verifyAdminSession('admin:123:deadbeef')).toBe(false);
  expect(verifyAdminSession('not-a-session')).toBe(false);
  expect(verifyAdminSession(undefined)).toBe(false);
});

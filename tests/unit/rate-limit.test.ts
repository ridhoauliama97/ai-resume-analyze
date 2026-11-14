import { expect, test } from 'vitest';
import { createRateLimiter } from '@/lib/rate-limit';

test('allows the limit, rejects the next call, and resets after the window', () => {
  let now = 1_000_000;
  const limiter = createRateLimiter({ limit: 10, windowMs: 60_000, now: () => now });

  for (let i = 0; i < 10; i += 1) {
    expect(limiter.check('client-a')).toBe(true);
  }

  expect(limiter.check('client-a')).toBe(false);

  now += 60_001;
  expect(limiter.check('client-a')).toBe(true);
});

test('keeps separate quotas per key', () => {
  const now = 0;
  const limiter = createRateLimiter({ limit: 2, windowMs: 1_000, now: () => now });

  expect(limiter.check('client-a')).toBe(true);
  expect(limiter.check('client-a')).toBe(true);
  expect(limiter.check('client-a')).toBe(false);

  expect(limiter.check('client-b')).toBe(true);
  expect(limiter.check('client-b')).toBe(true);
  expect(limiter.check('client-b')).toBe(false);
});

import { expect, test } from 'vitest';
import { withRetry } from '@/lib/ai/gemini';

test('retries once then succeeds', async () => {
  let calls = 0;

  const result = await withRetry(
    async () => {
      calls += 1;
      if (calls === 1) {
        throw { status: 429 };
      }
      return 'ok';
    },
    { retries: 1, baseDelayMs: 0 },
  );

  expect(result).toBe('ok');
  expect(calls).toBe(2);
});

test('does not retry 400', async () => {
  let calls = 0;

  await expect(
    withRetry(
      async () => {
        calls += 1;
        throw { status: 400 };
      },
      { retries: 1, baseDelayMs: 0 },
    ),
  ).rejects.toEqual({ status: 400 });

  expect(calls).toBe(1);
});

test('gives up after retries', async () => {
  let calls = 0;

  await expect(
    withRetry(
      async () => {
        calls += 1;
        throw { status: 503 };
      },
      { retries: 1, baseDelayMs: 0 },
    ),
  ).rejects.toEqual({ status: 503 });

  expect(calls).toBe(2);
});

test('supports a custom shouldRetry predicate', async () => {
  let calls = 0;

  await expect(
    withRetry(
      async () => {
        calls += 1;
        throw new Error('network');
      },
      { retries: 2, baseDelayMs: 0, shouldRetry: (error) => error instanceof Error },
    ),
  ).rejects.toThrow('network');

  expect(calls).toBe(3);
});

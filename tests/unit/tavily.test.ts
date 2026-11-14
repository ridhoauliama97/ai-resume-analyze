import { expect, test, vi } from 'vitest';
import { createTavilySearcher } from '@/lib/ai/tavily';

test('searches for the position and caps the summary at 4000 characters', async () => {
  const fetchImpl = vi.fn(async () =>
    new Response(
      JSON.stringify({
        results: [
          { title: 'Frontend Engineer', content: 'A'.repeat(3000) },
          { title: 'Skills', content: 'B'.repeat(3000) },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  );

  const searchMarket = createTavilySearcher({
    apiKey: 'tvly-test',
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });
  const result = await searchMarket('Frontend Engineer');

  expect(fetchImpl).toHaveBeenCalledTimes(1);

  const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
  const body = JSON.parse(String(init.body)) as {
    query: string;
    max_results: number;
  };

  expect(url).toContain('tavily.com');
  expect(body.query).toContain('Frontend Engineer');
  expect(body.query).toContain('required skills');
  expect(body.max_results).toBe(5);
  expect(result).toHaveLength(4000);
});

test('returns null for non-ok responses and fetch failures', async () => {
  const nonOk = createTavilySearcher({
    apiKey: 'tvly-test',
    fetchImpl: (async () => new Response('nope', { status: 500 })) as unknown as typeof fetch,
  });
  const rejects = createTavilySearcher({
    apiKey: 'tvly-test',
    fetchImpl: (async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch,
  });

  expect(await nonOk('Frontend Engineer')).toBeNull();
  expect(await rejects('Frontend Engineer')).toBeNull();
});

test('returns null without an API key and never calls fetch', async () => {
  const fetchImpl = vi.fn();
  const searchMarket = createTavilySearcher({ fetchImpl: fetchImpl as unknown as typeof fetch });

  expect(await searchMarket('Frontend Engineer')).toBeNull();
  expect(fetchImpl).not.toHaveBeenCalled();
});

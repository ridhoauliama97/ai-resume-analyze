import { afterEach, expect, test, vi } from 'vitest';
import { getWebAnalyticsSummary } from '@/lib/analytics/vercel';
import type { ServerEnv } from '@/lib/env';

function env(overrides: Partial<ServerEnv> = {}): ServerEnv {
  return {
    VERCEL_TOKEN: 'test-token',
    VERCEL_PROJECT_ID: 'prj_test',
    VERCEL_TEAM_ID: 'team_test',
    ...overrides,
  } as ServerEnv;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test('returns not_configured without a Vercel token', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  const result = await getWebAnalyticsSummary(env({ VERCEL_TOKEN: undefined }));

  expect(result).toEqual({ status: 'not_configured' });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('queries page views and visitors for the last 30 days', async () => {
  const fetchMock = vi.fn<(url: URL, init: RequestInit) => Promise<Response>>(
    async () =>
      new Response(JSON.stringify({ data: { pageviews: 1250, visitors: 980 } }), {
        status: 200,
      }),
  );
  vi.stubGlobal('fetch', fetchMock);

  const result = await getWebAnalyticsSummary(env());

  expect(result).toMatchObject({
    status: 'ok',
    pageviews: 1250,
    visitors: 980,
  });
  const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
  expect(url.searchParams.get('projectId')).toBe('prj_test');
  expect(url.searchParams.get('teamId')).toBe('team_test');
  expect(url.searchParams.get('since')).toEqual(expect.any(String));
  expect(url.searchParams.get('until')).toEqual(expect.any(String));
  expect(init.headers).toEqual({ Authorization: 'Bearer test-token' });
});

test('returns error when Vercel rejects the request', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('forbidden', { status: 403 })));

  expect(await getWebAnalyticsSummary(env())).toEqual({ status: 'error' });
});

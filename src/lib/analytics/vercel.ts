import type { ServerEnv } from '@/lib/env';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type WebAnalyticsSummary =
  | { status: 'not_configured' }
  | { status: 'error' }
  | {
      status: 'ok';
      pageviews: number;
      visitors: number;
      since: string;
    };

type VercelCountResponse = {
  data?: {
    pageviews?: unknown;
    visitors?: unknown;
  };
};

export async function getWebAnalyticsSummary(
  env: ServerEnv,
): Promise<WebAnalyticsSummary> {
  if (!env.VERCEL_TOKEN || !env.VERCEL_PROJECT_ID) {
    return { status: 'not_configured' };
  }

  const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
  const url = new URL('https://api.vercel.com/v1/query/web-analytics/visits/count');
  url.searchParams.set('projectId', env.VERCEL_PROJECT_ID);
  url.searchParams.set('since', since);

  if (env.VERCEL_TEAM_ID) {
    url.searchParams.set('teamId', env.VERCEL_TEAM_ID);
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { status: 'error' };
    }

    const payload = (await response.json()) as VercelCountResponse;
    const pageviews = payload.data?.pageviews;
    const visitors = payload.data?.visitors;

    if (typeof pageviews !== 'number' || typeof visitors !== 'number') {
      return { status: 'error' };
    }

    return { status: 'ok', pageviews, visitors, since };
  } catch {
    return { status: 'error' };
  }
}

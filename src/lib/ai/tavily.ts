export type MarketSearcher = (position: string) => Promise<string | null>;

const MAX_MARKET_CONTEXT_CHARS = 4_000;
const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

export function createTavilySearcher(opts: {
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): MarketSearcher {
  const { apiKey, timeoutMs = 8_000, fetchImpl = fetch } = opts;

  if (!apiKey) {
    return async () => null;
  }

  return async (position: string): Promise<string | null> => {
    try {
      const response = await fetchImpl(TAVILY_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: `${position} job description required skills responsibilities 2026`,
          max_results: 5,
          search_depth: 'basic',
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        results?: Array<{ title?: string; content?: string }>;
      };

      const summary = (data.results ?? [])
        .map((result) => [result.title, result.content].filter(Boolean).join('\n'))
        .filter((part) => part.length > 0)
        .join('\n\n')
        .slice(0, MAX_MARKET_CONTEXT_CHARS);

      return summary.length > 0 ? summary : null;
    } catch {
      return null;
    }
  };
}

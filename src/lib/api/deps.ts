import { createGeminiGenerator } from '@/lib/ai/gemini';
import { createMockGenerator } from '@/lib/ai/mock';
import { runAnalysis } from '@/lib/ai/analyze';
import { createTavilySearcher } from '@/lib/ai/tavily';
import { getDb } from '@/lib/db/client';
import { getServerEnv, type ServerEnv } from '@/lib/env';
import { parseResumeFile } from '@/lib/parsing';
import { createRateLimiter, type RateLimiter } from '@/lib/rate-limit';
import { createNoopResumeStorage, createResumeStorageFromEnv } from '@/lib/storage';
import type { AnalyzeHandlerDeps } from './analyze-handler';

let limiters: { client: RateLimiter; ip: RateLimiter } | null = null;

function getLimiters(): { client: RateLimiter; ip: RateLimiter } {
  if (!limiters) {
    limiters = {
      client: createRateLimiter({ limit: 10, windowMs: 60 * 60 * 1_000 }),
      ip: createRateLimiter({ limit: 20, windowMs: 60 * 60 * 1_000 }),
    };
  }

  return limiters;
}

export function buildAnalyzeDeps(env: ServerEnv = getServerEnv()): AnalyzeHandlerDeps {
  if (env.AI_MOCK === '1' && env.NODE_ENV === 'production') {
    throw new Error('AI_MOCK tidak boleh digunakan di production.');
  }

  const mock = env.AI_MOCK === '1';
  const generateJson = mock
    ? createMockGenerator()
    : createGeminiGenerator({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL });
  const searchMarket = mock
    ? async () => null
    : createTavilySearcher({ apiKey: env.TAVILY_API_KEY });
  const storage = mock ? createNoopResumeStorage() : createResumeStorageFromEnv(env);

  return {
    db: getDb(),
    analyze: (input) => runAnalysis(input, { generateJson, searchMarket }),
    parseFile: parseResumeFile,
    clientLimiter: getLimiters().client,
    ipLimiter: getLimiters().ip,
    storage,
    pepper: env.CLIENT_TOKEN_PEPPER,
    model: env.GEMINI_MODEL,
    secureCookies: env.NODE_ENV === 'production',
  };
}

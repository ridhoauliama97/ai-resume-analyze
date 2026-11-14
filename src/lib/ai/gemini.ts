import { GoogleGenAI } from '@google/genai';
import { geminiResponseSchema } from './schema';

export type JsonGenerator = (prompt: string) => Promise<unknown>;

function statusOf(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : null;
  }

  return null;
}

function defaultShouldRetry(error: unknown): boolean {
  const status = statusOf(error);
  return status === 429 || (status !== null && status >= 500 && status <= 599);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry<T>(
  op: () => Promise<T>,
  opts: {
    retries: number;
    baseDelayMs: number;
    shouldRetry?: (error: unknown) => boolean;
  },
): Promise<T> {
  const shouldRetry = opts.shouldRetry ?? defaultShouldRetry;
  let attempt = 0;

  for (;;) {
    try {
      return await op();
    } catch (error) {
      if (attempt >= opts.retries || !shouldRetry(error)) {
        throw error;
      }

      attempt += 1;
      if (opts.baseDelayMs > 0) {
        await delay(opts.baseDelayMs * 2 ** (attempt - 1));
      }
    }
  }
}

export function createGeminiGenerator(opts: {
  apiKey: string;
  model: string;
  timeoutMs?: number;
}): JsonGenerator {
  const ai = new GoogleGenAI({
    apiKey: opts.apiKey,
    httpOptions: { timeout: opts.timeoutMs ?? 60_000 },
  });

  return async (prompt: string): Promise<unknown> => {
    const response = await withRetry(
      () =>
        ai.models.generateContent({
          model: opts.model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: geminiResponseSchema,
            temperature: 0.2,
          },
        }),
      { retries: 1, baseDelayMs: 1_000 },
    );

    const text = response.text;
    if (!text) {
      throw new Error('Gemini mengembalikan respons kosong.');
    }

    return JSON.parse(text) as unknown;
  };
}

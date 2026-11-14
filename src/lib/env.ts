import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1).default('gemini-3.5-flash-lite'),
  TAVILY_API_KEY: z.string().optional(),
  CLIENT_TOKEN_PEPPER: z.string().min(1),
  AI_MOCK: z.enum(['0', '1']).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

export function getServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const env = envSchema.parse(source);

  if (env.AI_MOCK === '1' && env.NODE_ENV === 'production') {
    throw new Error('AI_MOCK tidak boleh digunakan di production.');
  }

  return env;
}

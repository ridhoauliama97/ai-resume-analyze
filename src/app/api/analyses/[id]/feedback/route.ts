import { handleFeedback } from '@/lib/api/feedback-handler';
import { getDb } from '@/lib/db/client';
import { getServerEnv } from '@/lib/env';
import { createResumeStorageFromEnv } from '@/lib/storage';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const env = getServerEnv();

  return handleFeedback(request, id, {
    db: getDb(),
    pepper: env.CLIENT_TOKEN_PEPPER,
    storage: createResumeStorageFromEnv(env),
  });
}

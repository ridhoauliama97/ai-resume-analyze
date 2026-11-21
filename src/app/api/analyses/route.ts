import { handleListAnalyses, type ReadHandlerDeps } from '@/lib/api/read-handlers';
import { getDb } from '@/lib/db/client';
import { getServerEnv } from '@/lib/env';
import { createResumeStorageFromEnv } from '@/lib/storage';

function deps(): ReadHandlerDeps {
  const env = getServerEnv();
  return {
    db: getDb(),
    pepper: env.CLIENT_TOKEN_PEPPER,
    storage: createResumeStorageFromEnv(env),
  };
}

export async function GET(request: Request) {
  return handleListAnalyses(request, deps());
}

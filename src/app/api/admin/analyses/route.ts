import { handleAdminListAnalyses } from '@/lib/api/admin-handlers';
import { getDb } from '@/lib/db/client';
import { getServerEnv } from '@/lib/env';
import { createResumeStorageFromEnv } from '@/lib/storage';

export async function GET(request: Request) {
  const env = getServerEnv();

  return handleAdminListAnalyses(request, {
    db: getDb(),
    storage: createResumeStorageFromEnv(env),
  });
}

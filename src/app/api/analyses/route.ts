import { handleListAnalyses, type ReadHandlerDeps } from '@/lib/api/read-handlers';
import { getDb } from '@/lib/db/client';
import { getServerEnv } from '@/lib/env';

function deps(): ReadHandlerDeps {
  const env = getServerEnv();
  return { db: getDb(), pepper: env.CLIENT_TOKEN_PEPPER };
}

export async function GET(request: Request) {
  return handleListAnalyses(request, deps());
}

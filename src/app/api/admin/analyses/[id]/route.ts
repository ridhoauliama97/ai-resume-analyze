import { handleAdminDeleteAnalysis, handleAdminGetAnalysis } from '@/lib/api/admin-handlers';
import { getDb } from '@/lib/db/client';
import { getServerEnv } from '@/lib/env';
import { createResumeStorageFromEnv } from '@/lib/storage';

type RouteContext = { params: Promise<{ id: string }> };

function deps() {
  const env = getServerEnv();
  return {
    db: getDb(),
    storage: createResumeStorageFromEnv(env),
  };
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleAdminGetAnalysis(request, id, deps());
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleAdminDeleteAnalysis(request, id, deps());
}

import {
  handleDeleteAnalysis,
  handleGetAnalysis,
  type ReadHandlerDeps,
} from '@/lib/api/read-handlers';
import { getDb } from '@/lib/db/client';
import { getServerEnv } from '@/lib/env';

function deps(): ReadHandlerDeps {
  const env = getServerEnv();
  return { db: getDb(), pepper: env.CLIENT_TOKEN_PEPPER };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleGetAnalysis(request, id, deps());
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleDeleteAnalysis(request, id, deps());
}

import { handleAdminDeleteAnalysis, handleAdminGetAnalysis } from '@/lib/api/admin-handlers';
import { getDb } from '@/lib/db/client';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleAdminGetAnalysis(request, id, { db: getDb() });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleAdminDeleteAnalysis(request, id, { db: getDb() });
}

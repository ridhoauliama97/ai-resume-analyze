import { handleAdminListAnalyses } from '@/lib/api/admin-handlers';
import { getDb } from '@/lib/db/client';

export async function GET(request: Request) {
  return handleAdminListAnalyses(request, { db: getDb() });
}

import { handleGetSettings } from '@/lib/api/settings-handlers';
import { getDb } from '@/lib/db/client';

export async function GET() {
  return handleGetSettings(getDb());
}

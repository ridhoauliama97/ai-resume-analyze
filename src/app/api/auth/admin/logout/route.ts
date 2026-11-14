import { handleAdminLogout } from '@/lib/api/admin-auth-handler';
import { getServerEnv } from '@/lib/env';

export async function POST(request: Request) {
  const env = getServerEnv();

  return handleAdminLogout(request, env.NODE_ENV === 'production');
}

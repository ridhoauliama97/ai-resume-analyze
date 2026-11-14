import { handleAdminLogout } from '@/lib/api/admin-auth-handler';
import { getServerEnv } from '@/lib/env';

export async function POST() {
  const env = getServerEnv();

  return handleAdminLogout(env.NODE_ENV === 'production');
}

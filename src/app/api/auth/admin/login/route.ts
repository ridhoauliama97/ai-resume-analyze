import { handleAdminLogin } from '@/lib/api/admin-auth-handler';
import { getServerEnv } from '@/lib/env';

export async function POST(request: Request) {
  const env = getServerEnv();

  return handleAdminLogin(request, {
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD,
    secureCookies: env.NODE_ENV === 'production',
  });
}

import { cookies } from 'next/headers';
import { CLIENT_COOKIE, hashClientToken } from './client-token';
import { getDb } from '@/lib/db/client';
import { getClientByTokenHash } from '@/lib/db/queries';
import { getServerEnv } from '@/lib/env';

export async function getCurrentClientId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const env = getServerEnv();
  return getClientByTokenHash(getDb(), hashClientToken(token, env.CLIENT_TOKEN_PEPPER));
}

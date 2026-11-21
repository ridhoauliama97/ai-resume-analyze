import { handleGetSettings, handleUpdateSettings } from '@/lib/api/settings-handlers';
import { getDb } from '@/lib/db/client';
import { getServerEnv } from '@/lib/env';
import { createSiteAssetStorageFromEnv, siteAssetPublicUrl } from '@/lib/storage';

export async function GET() {
  return handleGetSettings(getDb());
}

export async function PUT(request: Request) {
  const env = getServerEnv();

  return handleUpdateSettings(request, {
    db: getDb(),
    storage: createSiteAssetStorageFromEnv(env),
    publicUrl: (key) => siteAssetPublicUrl(env, key),
  });
}

import { beforeEach, expect, test } from 'vitest';
import { handleGetSettings, handleUpdateSettings } from '@/lib/api/settings-handlers';
import { ADMIN_COOKIE, createAdminSession } from '@/lib/auth/admin';
import { resetDb, testDb } from './helpers';
import { createMemoryStorage } from './storage-fake';

const ADMIN_COOKIE_VALUE = `${ADMIN_COOKIE}=${createAdminSession('admin')}`;

function form(
  siteName: string,
  options: { logo?: File; removeLogo?: boolean } = {},
): FormData {
  const data = new FormData();
  data.set('siteName', siteName);
  data.set('removeLogo', options.removeLogo ? 'true' : 'false');
  if (options.logo) {
    data.set('logo', options.logo);
  }
  return data;
}

function request(data: FormData, cookie?: string): Request {
  return new Request('http://localhost/api/admin/settings', {
    method: 'PUT',
    body: data,
    headers: cookie ? { cookie } : {},
  });
}

function deps(): Parameters<typeof handleUpdateSettings>[1] {
  return {
    db: testDb,
    storage: createMemoryStorage().storage,
    publicUrl: (key) => `https://cdn.test/${key}`,
  };
}

beforeEach(async () => {
  await resetDb();
});

test('rejects unauthenticated settings updates', async () => {
  const response = await handleUpdateSettings(request(form('Website')), deps());

  expect(response.status).toBe(401);
});

test('updates the site name and returns it publicly', async () => {
  const response = await handleUpdateSettings(
    request(form('Smart Resume Analyze'), ADMIN_COOKIE_VALUE),
    deps(),
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    settings: { siteName: 'Smart Resume Analyze', logoUrl: null },
  });

  const publicResponse = await handleGetSettings(testDb);
  expect(await publicResponse.json()).toEqual({
    settings: { siteName: 'Smart Resume Analyze', logoUrl: null },
  });
});

test('uploads a logo and stores its public URL', async () => {
  const storage = createMemoryStorage();
  const logo = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'logo.png', {
    type: 'image/png',
  });

  const response = await handleUpdateSettings(
    request(form('Brand', { logo }), ADMIN_COOKIE_VALUE),
    {
      db: testDb,
      storage: storage.storage,
      publicUrl: (key) => `https://cdn.test/${key}`,
    },
  );

  expect(response.status).toBe(200);
  const body = (await response.json()) as { settings: { logoUrl: string } };
  expect(body.settings.logoUrl).toMatch(/^https:\/\/cdn\.test\/branding\/.+\.png$/);
  expect(storage.uploads).toHaveLength(1);
  expect(storage.uploads[0].contentType).toBe('image/png');
});

test('rejects a non-image logo', async () => {
  const logo = new File([new TextEncoder().encode('not an image')], 'logo.txt', {
    type: 'text/plain',
  });

  const response = await handleUpdateSettings(
    request(form('Brand', { logo }), ADMIN_COOKIE_VALUE),
    deps(),
  );

  expect(response.status).toBe(400);
});

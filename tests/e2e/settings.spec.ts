import { expect, test } from '@playwright/test';

test('saving site settings persists the name and version, and updates the brand', async ({
  page,
}) => {
  const originalResponse = await page.request.get('/api/settings');
  const original = (await originalResponse.json()) as {
    settings: { siteName: string; logoUrl: string | null; appVersion: string };
  };
  const nextName = `Smart Resume Analyze E2E ${Date.now()}`;
  const nextVersion = `9.9.9-e2e${Date.now().toString().slice(-4)}`;

  await page.goto('/auth/admin');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('change-me');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL('/admin');

  await page.goto('/admin/settings');
  await page.getByLabel('Nama website').fill(nextName);
  await page.getByLabel('Versi sistem').fill(nextVersion);
  const firstSave = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/admin/settings') &&
      response.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  expect((await firstSave).ok()).toBeTruthy();
  await expect(page.getByText('Pengaturan tersimpan.')).toBeVisible();
  await expect(
    page.locator('[data-sidebar="header"]').getByText(nextName),
  ).toBeVisible();

  const persistedResponse = await page.request.get('/api/settings');
  const persisted = (await persistedResponse.json()) as {
    settings: { siteName: string; appVersion: string };
  };
  expect(persisted.settings.siteName).toBe(nextName);
  expect(persisted.settings.appVersion).toBe(nextVersion);

  await page.goto('/');
  await expect(page.getByRole('banner')).toContainText(nextName);
  await expect(page.locator('footer')).toContainText(nextName);
  await expect(page.locator('footer')).toContainText(`v${nextVersion}`);

  await page.goto('/admin/settings');
  await page.getByLabel('Nama website').fill(original.settings.siteName);
  await page.getByLabel('Versi sistem').fill(original.settings.appVersion);
  const restoreSave = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/admin/settings') &&
      response.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  expect((await restoreSave).ok()).toBeTruthy();
  await expect(
    page.locator('[data-sidebar="header"]').getByText(original.settings.siteName),
  ).toBeVisible();
  await page.goto('/');
  await expect(page.locator('footer')).toContainText(
    `v${original.settings.appVersion}`,
  );
});

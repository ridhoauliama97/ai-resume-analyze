import { expect, test } from '@playwright/test';

test('requires consent before submitting', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Berkas resume').setInputFiles('tests/fixtures/resume.pdf');
  await page.getByRole('button', { name: 'Analisis Resume' }).click();

  await expect(page.getByText('Persetujuan diperlukan sebelum analisis.')).toBeVisible();
});

test('shows a scan warning for a short PDF', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Berkas resume').setInputFiles('tests/fixtures/short.pdf');
  await page
    .getByRole('checkbox', { name: 'Persetujuan pemrosesan dan penyimpanan' })
    .check();
  await page.getByRole('button', { name: 'Analisis Resume' }).click();

  await expect(page.getByText(/scan/i).first()).toBeVisible();
});

test('privacy notice names Gemini and Tavily', async ({ page }) => {
  await page.goto('/privacy');

  await page.getByRole('button', { name: 'Cara data diproses' }).click();

  await expect(page.getByText(/Gemini/)).toBeVisible();
  await expect(page.getByText(/Tavily/)).toBeVisible();
});

test('admin can log in, open the dashboard, and browse history', async ({ page }) => {
  await page.goto('/auth/admin');

  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('change-me');
  await page.getByRole('button', { name: 'Masuk' }).click();

  await page.waitForURL('/admin');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.locator('[data-sidebar="header"] a').first()).toHaveAttribute(
    'href',
    '/admin',
  );
  await page.getByRole('link', { name: 'Riwayat Analisa' }).click();
  await page.waitForURL('/admin/analyze-history');
  await expect(page.getByRole('heading', { name: 'Riwayat Analisa' })).toBeVisible();
});

test('non-admin history route redirects to the home page', async ({ page }) => {
  await page.goto('/history');

  await page.waitForURL('/');
  await expect(page.getByRole('heading', { name: 'Nilai resume-mu sebelum dikirim.' })).toBeVisible();
});

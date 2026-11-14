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

  await expect(page.getByText(/scan/i)).toBeVisible();
});

test('privacy notice names Gemini and Tavily', async ({ page }) => {
  await page.goto('/privacy');

  await expect(page.getByText(/Gemini/)).toBeVisible();
  await expect(page.getByText(/Tavily/)).toBeVisible();
});

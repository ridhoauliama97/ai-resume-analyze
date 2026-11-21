import { expect, test } from '@playwright/test';

test('analyzes a resume, saves a vote, and deletes it', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Berkas resume').setInputFiles('tests/fixtures/resume.pdf');
  await page.getByLabel('Posisi target (opsional)').fill('Frontend Engineer');
  await page
    .getByRole('checkbox', { name: 'Persetujuan pemrosesan dan penyimpanan' })
    .check();
  await page.getByRole('checkbox', { name: 'Izin penggunaan dataset' }).check();
  await page.getByRole('button', { name: 'Analisis Resume' }).click();

  await page.waitForURL(/\/analysis\/[0-9a-f-]+$/);
  await expect(page.getByText('Skor total 79/100')).toBeVisible();
  await expect(page.getByText('Kuat', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Keyword & gap')).toBeVisible();
  await expect(page.getByText('PostgreSQL', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('TypeScript', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unduh laporan' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salin prompt perbaikan' })).toBeVisible();

  const thumbsUp = page.getByRole('button', { name: 'Bermanfaat' }).first();
  await expect(thumbsUp).toHaveAttribute('aria-pressed', 'false');
  await thumbsUp.click();
  await expect(thumbsUp).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(page.getByRole('button', { name: 'Bermanfaat' }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'Hapus analisis' }).click();
  await page.getByRole('button', { name: 'Hapus' }).click();
  await page.waitForURL('/');
  await expect(page.getByRole('heading', { name: 'Nilai resume-mu sebelum dikirim.' })).toBeVisible();
});

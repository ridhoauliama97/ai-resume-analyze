import { expect, test } from '@playwright/test';

test('admin dashboard and history table support search and bulk delete', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Berkas resume').setInputFiles('tests/fixtures/resume.pdf');
  await page
    .getByRole('checkbox', { name: 'Persetujuan pemrosesan dan penyimpanan' })
    .check();
  await page.getByRole('button', { name: 'Lihat skor resume saya' }).click();
  await page.waitForURL(/\/analysis\/[0-9a-f-]+$/);

  await page.goto('/auth/admin');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('change-me');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL('/admin');

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Total analisa')).toBeVisible();

  await page.getByRole('link', { name: 'Riwayat Analisa' }).click();
  await page.waitForURL('/admin/analyze-history');
  await expect(page.getByRole('heading', { name: 'Riwayat Analisa' })).toBeVisible();

  await page.getByLabel('Cari analisa').fill('resume.pdf');
  await expect(page.getByText('resume.pdf').first()).toBeVisible();

  await page.getByRole('checkbox', { name: 'Pilih semua hasil' }).check();
  await page.getByRole('button', { name: /Hapus 1 data/ }).click();
  await page.getByRole('button', { name: 'Hapus semua' }).click();

  await expect(page.getByText('1 analisis dihapus.')).toBeVisible();
  await expect(page.getByText('Belum ada analisis')).toBeVisible();
});

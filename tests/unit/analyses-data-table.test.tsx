// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { AnalysesDataTable } from '@/components/analyses-data-table';
import type { AdminAnalysisRow } from '@/lib/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function row(index: number): AdminAnalysisRow {
  const createdAt = new Date(Date.UTC(2026, 10, index, 10, 0, 0)).toISOString();

  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    fileName: `resume-${index}.pdf`,
    targetPosition: index % 2 === 0 ? 'Frontend Engineer' : null,
    overallScore: 70 + index,
    band: 'green',
    datasetConsent: index % 3 === 0,
    createdAt,
    searchText: `resume-${index}.pdf frontend engineer ${index}`,
  };
}

afterEach(() => {
  cleanup();
});

test('sorts newest first, paginates, and selects all filtered rows', async () => {
  const user = userEvent.setup();
  render(<AnalysesDataTable data={Array.from({ length: 12 }, (_, i) => row(i + 1))} />);

  expect(screen.getByText('1–10 dari 12')).toBeTruthy();

  const fileNames = screen
    .getAllByText(/^resume-\d+\.pdf$/)
    .map((element) => element.textContent);

  expect(fileNames[0]).toBe('resume-12.pdf');
  expect(fileNames).not.toContain('resume-1.pdf');

  await user.click(screen.getByRole('checkbox', { name: 'Pilih semua hasil' }));

  expect(screen.getByRole('button', { name: 'Hapus 12 data' })).toBeTruthy();

  await user.type(screen.getByLabelText('Cari analisa'), 'resume-1');

  expect(screen.getByText('1–4 dari 4')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Hapus \d+ data/ })).toBeNull();
});

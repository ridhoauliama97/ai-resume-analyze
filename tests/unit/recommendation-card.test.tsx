// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { RecommendationCard } from '@/components/recommendation-card';
import type { Recommendation } from '@/lib/db/queries';

const recommendation: Recommendation = {
  id: 'rec-1',
  analysisId: 'analysis-1',
  layer: 'global',
  category: 'G3',
  priority: 'high',
  title: 'Tambahkan pencapaian terukur',
  detail: 'Pencapaian belum disertai angka atau dampak yang terukur.',
  evidence: 'Tidak ada metrik pada deskripsi pengalaman.',
  example: 'Meningkatkan konversi checkout 12%.',
  sortOrder: 0,
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
  }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('sends thumbs vote', async () => {
  const user = userEvent.setup();
  render(
    <RecommendationCard
      recommendation={recommendation}
      initialRating={null}
      analysisId="analysis-1"
    />,
  );

  const down = screen.getByRole('button', { name: 'Tidak bermanfaat' });
  expect(down.getAttribute('aria-pressed')).toBe('false');

  await user.click(down);

  expect(fetchMock).toHaveBeenCalledTimes(1);

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe('/api/analyses/analysis-1/feedback');
  expect(init.method).toBe('POST');
  expect(JSON.parse(String(init.body))).toEqual({
    recommendationId: 'rec-1',
    rating: -1,
  });

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Tidak bermanfaat' }).getAttribute('aria-pressed'),
    ).toBe('true');
  });
});

test('shows initial vote', () => {
  render(
    <RecommendationCard
      recommendation={recommendation}
      initialRating={1}
      analysisId="analysis-1"
    />,
  );

  expect(
    screen.getByRole('button', { name: 'Bermanfaat' }).getAttribute('aria-pressed'),
  ).toBe('true');
  expect(
    screen.getByRole('button', { name: 'Tidak bermanfaat' }).getAttribute('aria-pressed'),
  ).toBe('false');
});

// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { DeleteAnalysisButton } from '@/components/delete-analysis-button';

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  push.mockReset();
  refresh.mockReset();
  fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('admin delete uses the admin endpoint and returns to the dashboard', async () => {
  const user = userEvent.setup();
  render(<DeleteAnalysisButton analysisId="abc" admin compact />);

  await user.click(screen.getByRole('button', { name: 'Hapus analisis' }));

  expect(fetchMock).toHaveBeenCalledWith('/api/admin/analyses/abc', {
    method: 'DELETE',
  });
  await waitFor(() => expect(push).toHaveBeenCalledWith('/admin'));
});

test('client delete uses the client endpoint and returns to history', async () => {
  const user = userEvent.setup();
  render(<DeleteAnalysisButton analysisId="abc" />);

  await user.click(screen.getByRole('button', { name: 'Hapus analisis' }));

  expect(fetchMock).toHaveBeenCalledWith('/api/analyses/abc', {
    method: 'DELETE',
  });
  await waitFor(() => expect(push).toHaveBeenCalledWith('/history'));
});

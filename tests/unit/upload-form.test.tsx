// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { UploadForm } from '@/components/upload-form';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

function pdfFile(): File {
  return new File(['%PDF-1.4\nresume'], 'resume.pdf', { type: 'application/pdf' });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  push.mockReset();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('requires consent before submit', async () => {
  const user = userEvent.setup();
  render(<UploadForm />);

  await user.upload(screen.getByLabelText(/berkas resume/i), pdfFile());
  await user.click(screen.getByRole('button', { name: 'Analisis Resume' }));

  expect(await screen.findByText(/Persetujuan diperlukan/i)).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('submits file and redirects', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ id: 'abc' }),
  });

  const user = userEvent.setup();
  render(<UploadForm />);

  await user.upload(screen.getByLabelText(/berkas resume/i), pdfFile());
  await user.type(screen.getByLabelText(/posisi target/i), 'Frontend Engineer');
  await user.click(screen.getByRole('checkbox', { name: /persetujuan pemrosesan/i }));
  await user.click(screen.getByRole('checkbox', { name: /dataset/i }));
  await user.click(screen.getByRole('button', { name: 'Analisis Resume' }));

  await waitFor(() => {
    expect(push).toHaveBeenCalledWith('/analysis/abc');
  });

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe('/api/analyze');
  expect(init.method).toBe('POST');

  const body = init.body as FormData;
  expect(body.get('consent')).toBe('true');
  expect(body.get('datasetConsent')).toBe('true');
  expect(body.get('targetPosition')).toBe('Frontend Engineer');
  expect((body.get('file') as File).name).toBe('resume.pdf');
});

test('shows an API error without redirecting', async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    status: 422,
    json: async () => ({ error: { message: 'Resume tidak bisa dibaca' } }),
  });

  const user = userEvent.setup();
  render(<UploadForm />);

  await user.upload(screen.getByLabelText(/berkas resume/i), pdfFile());
  await user.click(screen.getByRole('checkbox', { name: /persetujuan pemrosesan/i }));
  await user.click(screen.getByRole('button', { name: 'Analisis Resume' }));

  expect(await screen.findByText('Resume tidak bisa dibaca')).toBeTruthy();
  expect(push).not.toHaveBeenCalled();
});

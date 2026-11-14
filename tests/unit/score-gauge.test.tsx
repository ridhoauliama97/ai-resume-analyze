// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { ScoreGauge } from '@/components/score-gauge';
import { formatDateId } from '@/lib/format';

afterEach(() => {
  cleanup();
});

test('renders accessible score and band', () => {
  render(<ScoreGauge score={82} band="green" label="Kuat" />);

  const gauge = screen.getByRole('img', { name: 'Skor 82 dari 100, Kuat' });

  expect(gauge.getAttribute('data-band')).toBe('green');
  expect(screen.getByText('Kuat')).toBeTruthy();
});

test('renders a red band for a score below 50', () => {
  render(<ScoreGauge score={45} band="red" label="Perlu Perbaikan Besar" />);

  const gauge = screen.getByRole('img', {
    name: 'Skor 45 dari 100, Perlu Perbaikan Besar',
  });

  expect(gauge.getAttribute('data-band')).toBe('red');
});

test('formats dates in Indonesian', () => {
  expect(formatDateId('2026-11-14T10:00:00Z')).toBe('14 Nov 2026');
});

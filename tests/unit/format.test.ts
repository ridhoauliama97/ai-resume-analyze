import { expect, test } from 'vitest';
import { formatBand, formatScore } from '@/lib/format';

test('formats score', () => {
  expect(formatScore(82)).toBe('82/100');
});

test('maps bands to Indonesian labels', () => {
  expect(formatBand('red')).toBe('Perlu Perbaikan Besar');
  expect(formatBand('yellow')).toBe('Cukup — Banyak Ruang Perbaikan');
  expect(formatBand('green')).toBe('Kuat');
});

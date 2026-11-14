import type { Band } from './types';

const BAND_LABELS: Record<Band, string> = {
  red: 'Perlu Perbaikan Besar',
  yellow: 'Cukup — Banyak Ruang Perbaikan',
  green: 'Kuat',
};

export function formatScore(score: number): string {
  return `${score}/100`;
}

export function formatBand(band: Band): string {
  return BAND_LABELS[band];
}

const DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

export function formatDateId(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso));
}

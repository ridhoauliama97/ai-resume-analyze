import { expect, test } from 'vitest';
import { ZodError } from 'zod';
import {
  JOB_CATEGORY_CODES,
  aiResultSchema,
  parseAiResult,
  parseJobCategories,
  type AiResult,
} from '@/lib/ai/schema';
import { GLOBAL_CATEGORY_CODES } from '@/lib/ai/schema';

function validPayload(): AiResult {
  return {
    categories: GLOBAL_CATEGORY_CODES.map((code) => ({
      code,
      score: 80,
      reason: `Alasan untuk ${code}`,
      evidence: `Bukti untuk ${code}`,
    })),
    jobCategories: JOB_CATEGORY_CODES.map((code) => ({
      code,
      score: 70,
      reason: `Alasan untuk ${code}`,
      evidence: `Bukti untuk ${code}`,
    })),
    jobLayerNote: 'Dinilai berdasarkan JD.',
    recommendations: [
      {
        layer: 'global',
        category: 'G3',
        priority: 'high',
        title: 'Tambahkan angka pencapaian',
        detail: 'Pencapaian belum terukur.',
        evidence: 'Tidak ada metrik pada bagian pengalaman.',
        example: 'Meningkatkan konversi 12%.',
      },
      {
        layer: 'job',
        category: 'J1',
        priority: 'medium',
        title: 'Tambahkan React',
        detail: 'React disebut di JD tetapi tidak di resume.',
        evidence: 'Tidak ditemukan.',
      },
    ],
    keywords: {
      matched: ['TypeScript'],
      missing: ['React'],
      mustHaveMissing: ['React'],
      source: 'jd',
    },
    resumeMeta: { language: 'id', yearsExperienceEstimate: 6 },
  };
}

test('accepts a valid payload', () => {
  const parsed = parseAiResult(validPayload());

  expect(parsed.categories).toHaveLength(7);
  expect(parsed.jobCategories).toHaveLength(5);
  expect(parsed.recommendations).toHaveLength(2);
});

test('rejects six global categories', () => {
  const payload = validPayload();
  payload.categories = payload.categories.slice(0, 6);

  expect(() => aiResultSchema.parse(payload)).toThrow(ZodError);
});

test('rejects duplicate global category codes', () => {
  const payload = validPayload();
  payload.categories[6] = { ...payload.categories[6], code: 'G6' };

  expect(() => aiResultSchema.parse(payload)).toThrow(ZodError);
});

test('rejects a category score above 100', () => {
  const payload = validPayload();
  payload.categories[0] = { ...payload.categories[0], score: 101 };

  expect(() => aiResultSchema.parse(payload)).toThrow(ZodError);
});

test('rejects more than ten recommendations', () => {
  const payload = validPayload();
  payload.recommendations = Array.from({ length: 11 }, (_, index) => ({
    ...payload.recommendations[0],
    title: `Rekomendasi ${index}`,
  }));

  expect(() => aiResultSchema.parse(payload)).toThrow(ZodError);
});

test('rejects recommendations without title or detail', () => {
  const payload = validPayload();
  payload.recommendations[0] = { ...payload.recommendations[0], title: '' };
  payload.recommendations[1] = { ...payload.recommendations[1], detail: '' };

  expect(() => aiResultSchema.parse(payload)).toThrow(ZodError);
});

test('parseJobCategories degrades invalid payloads to null', () => {
  expect(parseJobCategories({})).toBeNull();
  expect(parseJobCategories(validPayload().jobCategories?.slice(0, 4))).toBeNull();
  expect(parseJobCategories(validPayload().jobCategories)).toHaveLength(5);
});

test('parseJobCategories rejects duplicate or out-of-range codes', () => {
  const payload = validPayload().jobCategories!;

  expect(
    parseJobCategories(payload.map((item, index) => (index === 4 ? { ...item, code: 'J4' } : item))),
  ).toBeNull();
  expect(
    parseJobCategories(payload.map((item, index) => (index === 0 ? { ...item, score: 101 } : item))),
  ).toBeNull();
});

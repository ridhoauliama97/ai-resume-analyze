import { expect, test, vi } from 'vitest';
import { runAnalysis } from '@/lib/ai/analyze';
import { createMockGenerator } from '@/lib/ai/mock';
import {
  GLOBAL_CATEGORY_CODES,
  JOB_CATEGORY_CODES,
  aiResultSchema,
  type AiResult,
} from '@/lib/ai/schema';

function payload(overrides: Partial<AiResult> = {}): AiResult {
  return {
    categories: GLOBAL_CATEGORY_CODES.map((code) => ({
      code,
      score: 80,
      reason: `Alasan ${code}`,
      evidence: `Bukti ${code}`,
    })),
    jobCategories: JOB_CATEGORY_CODES.map((code) => ({
      code,
      score: 70,
      reason: `Alasan ${code}`,
      evidence: `Bukti ${code}`,
    })),
    jobLayerNote: null,
    recommendations: [
      {
        layer: 'global',
        category: 'G3',
        priority: 'high',
        title: 'Tambahkan metrik',
        detail: 'Pencapaian belum terukur.',
        evidence: 'Tidak ada angka.',
      },
      {
        layer: 'job',
        category: 'J1',
        priority: 'medium',
        title: 'Tambahkan React',
        detail: 'React diminta di JD.',
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
    ...overrides,
  };
}

test('without position or JD uses the global score only', async () => {
  const searchMarket = vi.fn(async () => 'konteks pasar');

  const outcome = await runAnalysis(
    { resumeText: 'Resume contoh.' },
    { generateJson: async () => payload(), searchMarket },
  );

  expect(outcome.globalScore).toBe(80);
  expect(outcome.jobScore).toBeNull();
  expect(outcome.jobLayerStatus).toBe('none');
  expect(outcome.overallScore).toBe(80);
  expect(outcome.marketContext).toBeNull();
  expect(outcome.resultJson.jobCategories).toBeNull();
  expect(outcome.resultJson.keywords).toBeNull();
  expect(searchMarket).not.toHaveBeenCalled();
});

test('with a JD completes the job layer and blends 60/40', async () => {
  const searchMarket = vi.fn(async () => null);

  const outcome = await runAnalysis(
    { resumeText: 'Resume contoh.', jobDescription: 'Menguasai React.' },
    { generateJson: async () => payload(), searchMarket },
  );

  expect(outcome.jobLayerStatus).toBe('complete');
  expect(outcome.jobScore).toBe(70);
  expect(outcome.overallScore).toBe(76);
  expect(outcome.resultJson.jobCategories).toHaveLength(5);
  expect(searchMarket).not.toHaveBeenCalled();
});

test('a JD without a target position does not search the market', async () => {
  const searchMarket = vi.fn(async () => 'konteks pasar');

  const outcome = await runAnalysis(
    { resumeText: 'Resume contoh.', jobDescription: 'Menguasai React.' },
    { generateJson: async () => payload(), searchMarket },
  );

  expect(searchMarket).not.toHaveBeenCalled();
  expect(outcome.jobLayerStatus).toBe('complete');
});

test('a target position alone searches the market and marks the layer inferred', async () => {
  const searchMarket = vi.fn(async () => 'Ekspektasi pasar frontend.');

  const outcome = await runAnalysis(
    { resumeText: 'Resume contoh.', targetPosition: 'Frontend Engineer' },
    { generateJson: async () => payload(), searchMarket },
  );

  expect(searchMarket).toHaveBeenCalledWith('Frontend Engineer');
  expect(outcome.jobLayerStatus).toBe('inferred');
  expect(outcome.marketContext).toBe('Ekspektasi pasar frontend.');
  expect(outcome.jobScore).toBe(70);
  expect(outcome.resultJson.keywords?.source).toBe('market');
  expect(outcome.resultJson.keywords?.mustHaveMissing).toEqual([]);
});

test('degrades when job categories are invalid', async () => {
  const outcome = await runAnalysis(
    { resumeText: 'Resume contoh.', jobDescription: 'Menguasai React.' },
    {
      generateJson: async () =>
        payload({ jobCategories: payload().jobCategories!.slice(0, 3) }),
      searchMarket: async () => null,
    },
  );

  expect(outcome.jobLayerStatus).toBe('unavailable');
  expect(outcome.jobScore).toBeNull();
  expect(outcome.overallScore).toBe(outcome.globalScore);
  expect(outcome.resultJson.jobCategories).toBeNull();
  expect(outcome.resultJson.jobLayerNote).toContain('tidak tersedia');
});

test('throws when global categories are incomplete', async () => {
  await expect(
    runAnalysis(
      { resumeText: 'Resume contoh.' },
      {
        generateJson: async () => payload({ categories: payload().categories.slice(0, 6) }),
        searchMarket: async () => null,
      },
    ),
  ).rejects.toThrow();
});

test('truncates the resume at 30000 characters', async () => {
  let receivedPrompt = '';
  const marker = 'END_MARKER';
  const resumeText = 'A'.repeat(30_000) + marker + 'B'.repeat(9_999);

  await runAnalysis(
    { resumeText },
    {
      generateJson: async (prompt) => {
        receivedPrompt = prompt;
        return payload();
      },
      searchMarket: async () => null,
    },
  );

  expect(receivedPrompt).toContain('AAAA');
  expect(receivedPrompt).not.toContain(marker);
  expect(receivedPrompt.length).toBeLessThan(40_000);
});

test('createMockGenerator returns a schema-valid payload with deterministic scores', async () => {
  const generateJson = createMockGenerator();
  const raw = await generateJson('prompt');

  expect(() => aiResultSchema.parse(raw)).not.toThrow();

  const outcome = await runAnalysis(
    { resumeText: 'Resume contoh.', jobDescription: 'Menguasai React.' },
    { generateJson, searchMarket: async () => null },
  );

  expect(outcome.globalScore).toBe(82);
  expect(outcome.jobScore).toBe(74);
  expect(outcome.overallScore).toBe(79);
});

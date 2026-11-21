import { expect, test } from 'vitest';
import { buildImprovementPrompt } from '@/lib/ai/improvement-prompt';
import type { AnalysisDetail } from '@/lib/db/queries';

const analysis: AnalysisDetail = {
  id: 'analysis-1',
  clientId: 'client-1',
  fileName: 'resume.pdf',
  fileType: 'application/pdf',
  fileSize: 1024,
  resumeText: 'Resume lama.',
  resumeFileKey: null,
  targetPosition: 'Frontend Engineer',
  jobDescription: 'Menguasai React dan TypeScript.',
  marketContext: null,
  jobLayerStatus: 'complete',
  promptVersion: '2026-11-14-v1',
  model: 'gemini-3.5-flash-lite',
  globalScore: 72,
  jobScore: 68,
  overallScore: 70,
  band: 'green',
  datasetConsent: false,
  consentVersion: '2026-11-14',
  consentedAt: new Date('2026-11-14T10:00:00Z'),
  resultJson: {
    categories: [],
    resumeMeta: { language: 'id', yearsExperienceEstimate: 4 },
    recommendations: [
      {
        layer: 'global',
        category: 'G3',
        priority: 'high',
        title: 'Tambahkan pencapaian terukur',
        detail: 'Pencapaian belum disertai angka.',
        evidence: 'Tidak ada metrik.',
      },
    ],
    keywords: {
      matched: ['TypeScript'],
      missing: ['React', 'PostgreSQL'],
      mustHaveMissing: ['React'],
      source: 'jd',
    },
  },
  createdAt: new Date('2026-11-14T10:00:00Z'),
  recommendations: [],
  feedback: [],
};

test('builds an improvement prompt with scores, gaps, and recommendations', () => {
  const prompt = buildImprovementPrompt(analysis);

  expect(prompt).toContain('70/100');
  expect(prompt).toContain('React');
  expect(prompt).toContain('Tambahkan pencapaian terukur');
  expect(prompt).toContain('Resume lama.');
  expect(prompt.toLowerCase()).toContain('tanpa mengarang');
});

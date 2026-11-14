import type { JsonGenerator } from './gemini';
import {
  GLOBAL_CATEGORY_CODES,
  JOB_CATEGORY_CODES,
  type AiResult,
} from './schema';

export function createMockGenerator(): JsonGenerator {
  return async (): Promise<AiResult> => ({
    categories: GLOBAL_CATEGORY_CODES.map((code) => ({
      code,
      score: 82,
      reason: `Penilaian simulasi untuk ${code}.`,
      evidence: 'Data simulasi; tidak berasal dari resume nyata.',
    })),
    jobCategories: JOB_CATEGORY_CODES.map((code) => ({
      code,
      score: 74,
      reason: `Penilaian job-specific simulasi untuk ${code}.`,
      evidence: 'Data simulasi; tidak berasal dari resume nyata.',
    })),
    jobLayerNote: 'Dinilai berdasarkan job description simulasi.',
    recommendations: [
      {
        layer: 'global',
        category: 'G3',
        priority: 'high',
        title: 'Tambahkan pencapaian terukur',
        detail:
          'Pencapaian pada bagian pengalaman belum disertai angka atau dampak yang terukur, sehingga sulit dinilai ATS dan perekrut.',
        evidence: 'Tidak ada metrik pada deskripsi pengalaman.',
        example:
          'Meningkatkan konversi checkout 12% dengan migrasi 40+ halaman ke Next.js.',
      },
      {
        layer: 'job',
        category: 'J1',
        priority: 'medium',
        title: 'Lengkapi keyword yang diminta',
        detail:
          'Beberapa skill yang diminta lowongan belum muncul secara eksplisit di resume.',
        evidence: 'Tidak ditemukan.',
        example: 'Tambahkan bagian Keahlian: React, TypeScript, PostgreSQL.',
      },
    ],
    keywords: {
      matched: ['TypeScript', 'React'],
      missing: ['PostgreSQL'],
      mustHaveMissing: ['PostgreSQL'],
      source: 'jd',
    },
    resumeMeta: {
      language: 'id',
      yearsExperienceEstimate: 6,
    },
  });
}

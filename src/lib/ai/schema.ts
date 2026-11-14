import { Type, type Schema } from '@google/genai';
import { z } from 'zod';

export const GLOBAL_CATEGORY_CODES = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'] as const;
export const JOB_CATEGORY_CODES = ['J1', 'J2', 'J3', 'J4', 'J5'] as const;

export type CategoryScore = {
  code: string;
  score: number;
  reason: string;
  evidence: string;
};

export type JobCategoryScore = CategoryScore & {
  code: (typeof JOB_CATEGORY_CODES)[number];
};

export type RecommendationLayer = 'global' | 'job';
export type RecommendationPriority = 'high' | 'medium' | 'low';

export type AiRecommendation = {
  layer: RecommendationLayer;
  category: string;
  priority: RecommendationPriority;
  title: string;
  detail: string;
  evidence: string;
  example?: string | null;
};

export type KeywordAnalysis = {
  matched: string[];
  missing: string[];
  mustHaveMissing: string[];
  source: 'jd' | 'market' | 'inferred';
};

export type ResumeMeta = {
  language: string;
  yearsExperienceEstimate: number | null;
};

export type AiResult = {
  categories: CategoryScore[];
  jobCategories?: JobCategoryScore[] | null;
  jobLayerNote?: string | null;
  recommendations: AiRecommendation[];
  keywords?: KeywordAnalysis | null;
  resumeMeta: ResumeMeta;
};

export const categoryScoreSchema = z.object({
  code: z.string().min(1),
  score: z.number().min(0).max(100),
  reason: z.string().min(1),
  evidence: z.string().min(1),
});

export const jobCategoryScoreSchema = categoryScoreSchema.extend({
  code: z.enum(JOB_CATEGORY_CODES),
});

export const recommendationSchema = z.object({
  layer: z.enum(['global', 'job']),
  category: z.string().min(1),
  priority: z.enum(['high', 'medium', 'low']),
  title: z.string().min(1),
  detail: z.string().min(1),
  evidence: z.string().min(1),
  example: z.string().nullish(),
});

const keywordAnalysisSchema = z.object({
  matched: z.array(z.string()).default([]),
  missing: z.array(z.string()).default([]),
  mustHaveMissing: z.array(z.string()).default([]),
  source: z.enum(['jd', 'market', 'inferred']),
});

const resumeMetaSchema = z.object({
  language: z.string().min(1),
  yearsExperienceEstimate: z.number().min(0).max(60).nullable(),
});

const globalCategoriesSchema = z
  .array(categoryScoreSchema)
  .length(7)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();

    for (const item of items) {
      if (seen.has(item.code)) {
        ctx.addIssue({ code: 'custom', message: `Kode kategori ${item.code} duplikat.` });
      }
      seen.add(item.code);
    }

    for (const code of GLOBAL_CATEGORY_CODES) {
      if (!seen.has(code)) {
        ctx.addIssue({ code: 'custom', message: `Kode kategori ${code} wajib ada.` });
      }
    }
  });

const jobCategoriesSchema = z
  .array(jobCategoryScoreSchema)
  .length(5)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();

    for (const item of items) {
      if (seen.has(item.code)) {
        ctx.addIssue({ code: 'custom', message: `Kode kategori ${item.code} duplikat.` });
      }
      seen.add(item.code);
    }

    for (const code of JOB_CATEGORY_CODES) {
      if (!seen.has(code)) {
        ctx.addIssue({ code: 'custom', message: `Kode kategori ${code} wajib ada.` });
      }
    }
  });

export const aiResultSchema = z.object({
  categories: globalCategoriesSchema,
  jobCategories: z.unknown().optional(),
  jobLayerNote: z.string().nullish(),
  recommendations: z.array(recommendationSchema).max(10),
  keywords: keywordAnalysisSchema.nullish(),
  resumeMeta: resumeMetaSchema,
});

export function parseAiResult(raw: unknown): AiResult {
  return aiResultSchema.parse(raw) as AiResult;
}

export function parseJobCategories(raw: unknown): JobCategoryScore[] | null {
  const result = jobCategoriesSchema.safeParse(raw);
  return result.success ? result.data : null;
}

const categoryGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    code: { type: Type.STRING, description: 'Kode kategori, misalnya G1 atau J1.' },
    score: { type: Type.INTEGER, minimum: 0, maximum: 100 },
    reason: { type: Type.STRING, description: 'Alasan singkat penilaian dalam Bahasa Indonesia.' },
    evidence: {
      type: Type.STRING,
      description: 'Kutipan atau bagian resume yang menjadi dasar; tulis "tidak ada" bila temuan berupa hal yang hilang.',
    },
  },
  required: ['code', 'score', 'reason', 'evidence'],
  propertyOrdering: ['code', 'score', 'reason', 'evidence'],
};

const recommendationGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    layer: { type: Type.STRING, format: 'enum', enum: ['global', 'job'] },
    category: { type: Type.STRING, description: 'Kode kategori terkait, misalnya G3 atau J1.' },
    priority: { type: Type.STRING, format: 'enum', enum: ['high', 'medium', 'low'] },
    title: { type: Type.STRING },
    detail: { type: Type.STRING },
    evidence: { type: Type.STRING },
    example: { type: Type.STRING, nullable: true },
  },
  required: ['layer', 'category', 'priority', 'title', 'detail', 'evidence'],
  propertyOrdering: ['layer', 'category', 'priority', 'title', 'detail', 'evidence', 'example'],
};

export const geminiResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    categories: {
      type: Type.ARRAY,
      description: 'Tepat tujuh skor kategori global G1–G7, masing-masing sekali.',
      minItems: '7',
      maxItems: '7',
      items: {
        ...categoryGeminiSchema,
        properties: {
          ...categoryGeminiSchema.properties,
          code: { type: Type.STRING, format: 'enum', enum: [...GLOBAL_CATEGORY_CODES] },
        },
      },
    },
    jobCategories: {
      type: Type.ARRAY,
      description: 'Tepat lima skor kategori job-specific J1–J5; isi hanya bila ada posisi target atau JD.',
      minItems: '5',
      maxItems: '5',
      items: {
        ...categoryGeminiSchema,
        properties: {
          ...categoryGeminiSchema.properties,
          code: { type: Type.STRING, format: 'enum', enum: [...JOB_CATEGORY_CODES] },
        },
      },
    },
    jobLayerNote: {
      type: Type.STRING,
      nullable: true,
      description: 'Catatan singkat tentang sumber penilaian job-specific.',
    },
    recommendations: {
      type: Type.ARRAY,
      description: 'Maksimal 10 anjuran perbaikan, diurutkan high → medium → low.',
      maxItems: '10',
      items: recommendationGeminiSchema,
    },
    keywords: {
      type: Type.OBJECT,
      properties: {
        matched: { type: Type.ARRAY, items: { type: Type.STRING } },
        missing: { type: Type.ARRAY, items: { type: Type.STRING } },
        mustHaveMissing: { type: Type.ARRAY, items: { type: Type.STRING } },
        source: { type: Type.STRING, format: 'enum', enum: ['jd', 'market', 'inferred'] },
      },
      required: ['matched', 'missing', 'mustHaveMissing', 'source'],
      propertyOrdering: ['matched', 'missing', 'mustHaveMissing', 'source'],
    },
    resumeMeta: {
      type: Type.OBJECT,
      properties: {
        language: { type: Type.STRING, description: 'Bahasa utama resume, misalnya "id" atau "en".' },
        yearsExperienceEstimate: {
          type: Type.NUMBER,
          nullable: true,
          description: 'Perkiraan total tahun pengalaman kerja; null bila tidak bisa disimpulkan.',
        },
      },
      required: ['language', 'yearsExperienceEstimate'],
      propertyOrdering: ['language', 'yearsExperienceEstimate'],
    },
  },
  required: ['categories', 'recommendations', 'resumeMeta'],
  propertyOrdering: [
    'categories',
    'jobCategories',
    'jobLayerNote',
    'recommendations',
    'keywords',
    'resumeMeta',
  ],
};

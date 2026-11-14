import type { Band } from '@/lib/types';
import { GLOBAL_WEIGHTS, JOB_WEIGHTS, bandForScore, overallScore, weightedScore } from '@/lib/scoring';
import type { JsonGenerator } from './gemini';
import { PROMPT_VERSION, buildAnalysisPrompt } from './prompt';
import {
  parseAiResult,
  parseJobCategories,
  type AiResult,
  type JobCategoryScore,
  type KeywordAnalysis,
} from './schema';
import type { MarketSearcher } from './tavily';

const MAX_RESUME_CHARS = 30_000;

export type JobLayerStatus = 'none' | 'complete' | 'inferred' | 'unavailable';

export type AnalysisOutcome = {
  globalScore: number;
  jobScore: number | null;
  overallScore: number;
  band: Band;
  jobLayerStatus: JobLayerStatus;
  resultJson: AiResult;
  promptVersion: string;
  marketContext: string | null;
};

function normalizeKeywords(
  keywords: KeywordAnalysis | null | undefined,
  jobDescription: string | null,
  marketContext: string | null,
): KeywordAnalysis | null {
  if (!keywords) {
    return null;
  }

  return {
    ...keywords,
    mustHaveMissing: jobDescription ? keywords.mustHaveMissing : [],
    source: jobDescription ? 'jd' : marketContext ? 'market' : 'inferred',
  };
}

export async function runAnalysis(
  input: {
    resumeText: string;
    targetPosition?: string | null;
    jobDescription?: string | null;
  },
  deps: { generateJson: JsonGenerator; searchMarket: MarketSearcher },
): Promise<AnalysisOutcome> {
  const resumeText = input.resumeText.slice(0, MAX_RESUME_CHARS);
  const targetPosition = input.targetPosition?.trim() || null;
  const jobDescription = input.jobDescription?.trim() || null;
  const hasJobContext = Boolean(targetPosition || jobDescription);

  let marketContext: string | null = null;

  if (targetPosition) {
    try {
      marketContext = (await deps.searchMarket(targetPosition))?.trim() || null;
    } catch {
      marketContext = null;
    }
  }

  const prompt = buildAnalysisPrompt({
    resumeText,
    targetPosition,
    jobDescription,
    marketContext,
  });

  let parsed: AiResult;

  try {
    parsed = parseAiResult(await deps.generateJson(prompt));
  } catch {
    // Spec §17: one corrective retry before failing when AI JSON is invalid.
    parsed = parseAiResult(await deps.generateJson(prompt));
  }
  const globalScore = weightedScore(parsed.categories, GLOBAL_WEIGHTS);

  if (globalScore === null) {
    throw new Error('Skor global tidak dapat dihitung dari kategori yang diberikan model.');
  }

  let jobScore: number | null = null;
  let jobLayerStatus: JobLayerStatus = 'none';
  let jobCategories: JobCategoryScore[] | null = null;
  let jobLayerNote = parsed.jobLayerNote ?? null;
  let keywords = normalizeKeywords(parsed.keywords, jobDescription, marketContext);

  if (hasJobContext) {
    jobCategories = parseJobCategories(parsed.jobCategories);

    if (jobCategories) {
      jobScore = weightedScore(jobCategories, JOB_WEIGHTS);

      if (jobScore === null) {
        jobCategories = null;
        jobLayerStatus = 'unavailable';
        jobLayerNote =
          'Penilaian job-specific tidak tersedia karena data kategori dari model tidak valid.';
      } else {
        jobLayerStatus = jobDescription ? 'complete' : 'inferred';
        jobLayerNote =
          jobLayerNote ??
          (jobDescription
            ? 'Dinilai berdasarkan job description.'
            : 'Dinilai dari ekspektasi pasar dan pengetahuan umum karena job description tidak diberikan.');
      }
    } else {
      jobLayerStatus = 'unavailable';
      jobLayerNote =
        'Penilaian job-specific tidak tersedia karena data kategori dari model tidak valid.';
    }
  } else {
    jobLayerNote = null;
    keywords = null;
  }

  const overall = overallScore(globalScore, jobScore);

  return {
    globalScore,
    jobScore,
    overallScore: overall,
    band: bandForScore(overall),
    jobLayerStatus,
    resultJson: {
      ...parsed,
      jobCategories,
      jobLayerNote,
      keywords,
    },
    promptVersion: PROMPT_VERSION,
    marketContext,
  };
}

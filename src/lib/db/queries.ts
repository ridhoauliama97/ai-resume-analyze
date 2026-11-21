import { and, desc, eq } from 'drizzle-orm';
import type { AiResult } from '@/lib/ai/schema';
import type { Band } from '@/lib/types';
import type { Db } from './client';
import { analyses, appSettings, clients, feedback, recommendations } from './schema';

export type SiteSettings = {
  siteName: string;
  logoUrl: string | null;
};

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'Smart Resume Analyze',
  logoUrl: null,
};

export async function getSiteSettings(db: Db): Promise<SiteSettings> {
  const [row] = await db
    .select({ siteName: appSettings.siteName, logoUrl: appSettings.logoUrl })
    .from(appSettings)
    .limit(1);

  return row ?? DEFAULT_SITE_SETTINGS;
}

export async function updateSiteSettings(
  db: Db,
  input: SiteSettings,
): Promise<SiteSettings> {
  const [row] = await db
    .insert(appSettings)
    .values({ id: 'default', siteName: input.siteName, logoUrl: input.logoUrl })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        siteName: input.siteName,
        logoUrl: input.logoUrl,
        updatedAt: new Date(),
      },
    })
    .returning({ siteName: appSettings.siteName, logoUrl: appSettings.logoUrl });

  return row;
}

export type Analysis = typeof analyses.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;

export type AnalysisDetail = Analysis & {
  recommendations: Recommendation[];
  feedback: Feedback[];
};

export type AnalysisSummary = Pick<
  Analysis,
  'id' | 'fileName' | 'targetPosition' | 'overallScore' | 'band' | 'createdAt'
>;

export type NewAnalysisRecord = {
  clientId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  resumeText: string;
  resumeFileKey: string | null;
  targetPosition: string | null;
  jobDescription: string | null;
  marketContext: string | null;
  jobLayerStatus: 'none' | 'complete' | 'inferred' | 'unavailable';
  promptVersion: string;
  model: string;
  globalScore: number;
  jobScore: number | null;
  overallScore: number;
  band: Band;
  datasetConsent: boolean;
  consentVersion: string;
  consentedAt: Date;
  resultJson: AiResult;
};

export async function upsertClient(db: Db, tokenHash: string): Promise<string> {
  const [row] = await db
    .insert(clients)
    .values({ tokenHash })
    .onConflictDoUpdate({
      target: clients.tokenHash,
      set: { lastSeenAt: new Date() },
    })
    .returning({ id: clients.id });

  return row.id;
}

export async function getClientByTokenHash(db: Db, tokenHash: string): Promise<string | null> {
  const [row] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.tokenHash, tokenHash))
    .limit(1);

  return row?.id ?? null;
}

export async function createAnalysis(db: Db, record: NewAnalysisRecord): Promise<string> {
  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(analyses)
      .values({
        clientId: record.clientId,
        fileName: record.fileName,
        fileType: record.fileType,
        fileSize: record.fileSize,
        resumeText: record.resumeText,
        resumeFileKey: record.resumeFileKey,
        targetPosition: record.targetPosition,
        jobDescription: record.jobDescription,
        marketContext: record.marketContext,
        jobLayerStatus: record.jobLayerStatus,
        promptVersion: record.promptVersion,
        model: record.model,
        globalScore: record.globalScore,
        jobScore: record.jobScore,
        overallScore: record.overallScore,
        band: record.band,
        datasetConsent: record.datasetConsent,
        consentVersion: record.consentVersion,
        consentedAt: record.consentedAt,
        resultJson: record.resultJson,
      })
      .returning({ id: analyses.id });

    if (record.resultJson.recommendations.length > 0) {
      await tx.insert(recommendations).values(
        record.resultJson.recommendations.map((recommendation, index) => ({
          analysisId: inserted.id,
          layer: recommendation.layer,
          category: recommendation.category,
          priority: recommendation.priority,
          title: recommendation.title,
          detail: recommendation.detail,
          evidence: recommendation.evidence,
          example: recommendation.example ?? null,
          sortOrder: index,
        })),
      );
    }

    return inserted.id;
  });
}

export async function getAnalysisForClient(
  db: Db,
  id: string,
  clientId: string,
): Promise<AnalysisDetail | null> {
  const [analysis] = await db
    .select()
    .from(analyses)
    .where(and(eq(analyses.id, id), eq(analyses.clientId, clientId)))
    .limit(1);

  if (!analysis) {
    return null;
  }

  const [recommendationRows, feedbackRows] = await Promise.all([
    db
      .select()
      .from(recommendations)
      .where(eq(recommendations.analysisId, id))
      .orderBy(recommendations.sortOrder),
    db
      .select()
      .from(feedback)
      .where(eq(feedback.analysisId, id))
      .orderBy(desc(feedback.createdAt)),
  ]);

  return { ...analysis, recommendations: recommendationRows, feedback: feedbackRows };
}

export async function listAnalysesForClient(
  db: Db,
  clientId: string,
): Promise<AnalysisSummary[]> {
  return db
    .select({
      id: analyses.id,
      fileName: analyses.fileName,
      targetPosition: analyses.targetPosition,
      overallScore: analyses.overallScore,
      band: analyses.band,
      createdAt: analyses.createdAt,
    })
    .from(analyses)
    .where(eq(analyses.clientId, clientId))
    .orderBy(desc(analyses.createdAt));
}

export async function deleteAnalysisById(db: Db, id: string): Promise<boolean> {
  const deleted = await db
    .delete(analyses)
    .where(eq(analyses.id, id))
    .returning({ id: analyses.id });

  return deleted.length > 0;
}

export async function getAnalysisById(db: Db, id: string): Promise<AnalysisDetail | null> {
  const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);

  if (!analysis) {
    return null;
  }

  const [recommendationRows, feedbackRows] = await Promise.all([
    db
      .select()
      .from(recommendations)
      .where(eq(recommendations.analysisId, id))
      .orderBy(recommendations.sortOrder),
    db
      .select()
      .from(feedback)
      .where(eq(feedback.analysisId, id))
      .orderBy(desc(feedback.createdAt)),
  ]);

  return { ...analysis, recommendations: recommendationRows, feedback: feedbackRows };
}

export async function listAllAnalyses(db: Db): Promise<Analysis[]> {
  return db.select().from(analyses).orderBy(desc(analyses.createdAt));
}

export async function deleteAnalysisForClient(
  db: Db,
  id: string,
  clientId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(analyses)
    .where(and(eq(analyses.id, id), eq(analyses.clientId, clientId)))
    .returning({ id: analyses.id });

  return deleted.length > 0;
}

export type SaveFeedbackInput = {
  analysisId: string;
  clientId: string;
  recommendationId?: string;
  rating?: -1 | 1;
  comment?: string;
};

export async function saveFeedback(
  db: Db,
  input: SaveFeedbackInput,
): Promise<'saved' | 'not_found' | 'invalid'> {
  const [analysis] = await db
    .select({ id: analyses.id })
    .from(analyses)
    .where(and(eq(analyses.id, input.analysisId), eq(analyses.clientId, input.clientId)))
    .limit(1);

  if (!analysis) {
    return 'not_found';
  }

  let recommendationId: string | null = null;

  if (input.recommendationId) {
    const [recommendation] = await db
      .select({ id: recommendations.id })
      .from(recommendations)
      .where(
        and(
          eq(recommendations.id, input.recommendationId),
          eq(recommendations.analysisId, input.analysisId),
        ),
      )
      .limit(1);

    if (!recommendation) {
      return 'invalid';
    }

    recommendationId = recommendation.id;
  }

  if (input.rating === undefined && input.comment === undefined) {
    return 'invalid';
  }

  if (input.rating !== undefined) {
    if (!recommendationId) {
      return 'invalid';
    }

    await db
      .insert(feedback)
      .values({
        analysisId: input.analysisId,
        recommendationId,
        rating: input.rating,
        comment: input.comment ?? null,
      })
      .onConflictDoUpdate({
        target: [feedback.analysisId, feedback.recommendationId],
        set: {
          rating: input.rating,
          comment: input.comment ?? null,
        },
      });

    return 'saved';
  }

  await db.insert(feedback).values({
    analysisId: input.analysisId,
    recommendationId,
    rating: null,
    comment: input.comment ?? null,
  });

  return 'saved';
}

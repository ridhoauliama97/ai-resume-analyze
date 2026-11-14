import { and, desc, eq } from 'drizzle-orm';
import type { Band } from '@/lib/types';
import type { Db } from './client';
import {
  analyses,
  clients,
  feedback,
  recommendations,
  type StoredResultJson,
} from './schema';

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
  resultJson: StoredResultJson;
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

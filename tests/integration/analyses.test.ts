import { eq } from 'drizzle-orm';
import { beforeEach, expect, test } from 'vitest';
import {
  createAnalysis,
  deleteAnalysisForClient,
  getAnalysisForClient,
  listAnalysesForClient,
  upsertClient,
  type NewAnalysisRecord,
} from '@/lib/db/queries';
import { recommendations } from '@/lib/db/schema';
import { resetDb, testDb } from './helpers';

function record(clientId: string): NewAnalysisRecord {
  return {
    clientId,
    fileName: 'resume.pdf',
    fileType: 'application/pdf',
    fileSize: 1024,
    resumeText: 'Ahmad Pratama — Frontend Engineer dengan pengalaman 6 tahun.',
    targetPosition: 'Frontend Engineer',
    jobDescription: null,
    marketContext: null,
    jobLayerStatus: 'inferred',
    promptVersion: '2026-11-14-v1',
    model: 'gemini-3.5-flash-lite',
    globalScore: 80,
    jobScore: 70,
    overallScore: 76,
    band: 'green',
    datasetConsent: true,
    consentVersion: '2026-11-14',
    consentedAt: new Date('2026-11-14T10:00:00Z'),
    resultJson: {
      recommendations: [
        {
          layer: 'global',
          category: 'G1',
          priority: 'high',
          title: 'Struktur ATS',
          detail: 'Perbaiki heading.',
          evidence: 'Bagian pengalaman tanpa heading.',
        },
        {
          layer: 'job',
          category: 'J1',
          priority: 'medium',
          title: 'Keyword React',
          detail: 'Tambahkan React.',
          evidence: 'Tidak ditemukan di resume.',
          example: 'React, TypeScript',
        },
      ],
    },
  };
}

beforeEach(async () => {
  await resetDb();
});

test('creates analysis with recommendations and lists it for its client', async () => {
  const clientId = await upsertClient(testDb, 'hash-a');
  const id = await createAnalysis(testDb, record(clientId));

  const detail = await getAnalysisForClient(testDb, id, clientId);

  expect(detail?.recommendations).toHaveLength(2);
  expect(detail?.recommendations[0].title).toBe('Struktur ATS');
  expect((await listAnalysesForClient(testDb, clientId))[0].id).toBe(id);
});

test('delete removes analysis and cascades recommendations', async () => {
  const clientId = await upsertClient(testDb, 'hash-b');
  const id = await createAnalysis(testDb, record(clientId));

  expect(await deleteAnalysisForClient(testDb, id, clientId)).toBe(true);
  expect(await getAnalysisForClient(testDb, id, clientId)).toBeNull();
  expect(
    await testDb.select().from(recommendations).where(eq(recommendations.analysisId, id)),
  ).toHaveLength(0);
});

test('upsertClient returns the same id for the same hash', async () => {
  const first = await upsertClient(testDb, 'hash-c');
  const second = await upsertClient(testDb, 'hash-c');

  expect(second).toBe(first);
});

test('getAnalysisForClient hides other clients analyses', async () => {
  const owner = await upsertClient(testDb, 'hash-owner');
  const stranger = await upsertClient(testDb, 'hash-stranger');
  const id = await createAnalysis(testDb, record(owner));

  expect(await getAnalysisForClient(testDb, id, stranger)).toBeNull();
});

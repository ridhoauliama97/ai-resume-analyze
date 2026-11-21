import { eq } from 'drizzle-orm';
import { beforeEach, expect, test } from 'vitest';
import { handleFeedback } from '@/lib/api/feedback-handler';
import { CLIENT_COOKIE, hashClientToken } from '@/lib/auth/client-token';
import type { ReadHandlerDeps } from '@/lib/api/read-handlers';
import { feedback, recommendations } from '@/lib/db/schema';
import {
  createAnalysis,
  upsertClient,
  type NewAnalysisRecord,
} from '@/lib/db/queries';
import { resetDb, testDb } from './helpers';
import { createMemoryStorage } from './storage-fake';

const PEPPER = 'feedback-test-pepper';

function record(clientId: string): NewAnalysisRecord {
  return {
    clientId,
    fileName: 'resume.pdf',
    fileType: 'application/pdf',
    fileSize: 1024,
    resumeText: 'Ahmad Pratama — Frontend Engineer dengan pengalaman 6 tahun.',
    resumeFileKey: 'clients/test/resume.pdf',
    targetPosition: null,
    jobDescription: null,
    marketContext: null,
    jobLayerStatus: 'none',
    promptVersion: '2026-11-14-v1',
    model: 'gemini-3.5-flash-lite',
    globalScore: 80,
    jobScore: null,
    overallScore: 80,
    band: 'green',
    datasetConsent: false,
    consentVersion: '2026-11-14',
    consentedAt: new Date('2026-11-14T10:00:00Z'),
    resultJson: {
      categories: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'].map((code) => ({
        code,
        score: 80,
        reason: `Alasan ${code}`,
        evidence: `Bukti ${code}`,
      })),
      resumeMeta: { language: 'id', yearsExperienceEstimate: 6 },
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
          layer: 'global',
          category: 'G4',
          priority: 'medium',
          title: 'Rapikan skill',
          detail: 'Skill belum konsisten.',
          evidence: 'Tidak ada bagian keahlian.',
        },
      ],
    },
  };
}

async function seed(token: string): Promise<{ id: string; recommendationIds: string[] }> {
  const clientId = await upsertClient(testDb, hashClientToken(token, PEPPER));
  const id = await createAnalysis(testDb, record(clientId));
  const rows = await testDb
    .select({ id: recommendations.id })
    .from(recommendations)
    .where(eq(recommendations.analysisId, id))
    .orderBy(recommendations.sortOrder);

  return { id, recommendationIds: rows.map((row) => row.id) };
}

function deps(): ReadHandlerDeps {
  return { db: testDb, pepper: PEPPER, storage: createMemoryStorage().storage };
}

function request(id: string, body: unknown, token?: string): Request {
  return new Request(`http://localhost/api/analyses/${id}/feedback`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { cookie: `${CLIENT_COOKIE}=${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  await resetDb();
});

test('the first thumbs vote creates one feedback row', async () => {
  const { id, recommendationIds } = await seed('token-a');

  const response = await handleFeedback(
    request(id, { recommendationId: recommendationIds[0], rating: 1 }, 'token-a'),
    id,
    deps(),
  );

  expect(response.status).toBe(200);

  const rows = await testDb.select().from(feedback);
  expect(rows).toHaveLength(1);
  expect(rows[0].rating).toBe(1);
  expect(rows[0].recommendationId).toBe(recommendationIds[0]);
});

test('updates_existing_vote_instead_of_inserting', async () => {
  const { id, recommendationIds } = await seed('token-a');

  await handleFeedback(
    request(id, { recommendationId: recommendationIds[0], rating: 1 }, 'token-a'),
    id,
    deps(),
  );
  const second = await handleFeedback(
    request(id, { recommendationId: recommendationIds[0], rating: -1 }, 'token-a'),
    id,
    deps(),
  );

  expect(second.status).toBe(200);

  const rows = await testDb.select().from(feedback);
  expect(rows).toHaveLength(1);
  expect(rows[0].rating).toBe(-1);
});

test('stores an overall comment without a rating', async () => {
  const { id } = await seed('token-a');

  const response = await handleFeedback(
    request(id, { comment: 'Saran umum untuk report ini.' }, 'token-a'),
    id,
    deps(),
  );

  expect(response.status).toBe(200);

  const rows = await testDb.select().from(feedback);
  expect(rows).toHaveLength(1);
  expect(rows[0].rating).toBeNull();
  expect(rows[0].recommendationId).toBeNull();
  expect(rows[0].comment).toBe('Saran umum untuk report ini.');
});

test('rejects an empty body and an invalid rating', async () => {
  const { id, recommendationIds } = await seed('token-a');

  const empty = await handleFeedback(request(id, {}, 'token-a'), id, deps());
  const zero = await handleFeedback(
    request(id, { recommendationId: recommendationIds[0], rating: 0 }, 'token-a'),
    id,
    deps(),
  );

  expect(empty.status).toBe(400);
  expect(zero.status).toBe(400);
  expect(await testDb.select().from(feedback)).toHaveLength(0);
});

test('returns 404 for another clients analysis and stores nothing', async () => {
  const { id, recommendationIds } = await seed('token-a');

  const response = await handleFeedback(
    request(id, { recommendationId: recommendationIds[0], rating: 1 }, 'token-b'),
    id,
    deps(),
  );

  expect(response.status).toBe(404);
  expect(await testDb.select().from(feedback)).toHaveLength(0);
});

test('rejects a recommendation that belongs to another analysis', async () => {
  const first = await seed('token-a');
  const second = await seed('token-a');

  const response = await handleFeedback(
    request(first.id, { recommendationId: second.recommendationIds[0], rating: 1 }, 'token-a'),
    first.id,
    deps(),
  );

  expect(response.status).toBe(400);
  expect(await testDb.select().from(feedback)).toHaveLength(0);
});

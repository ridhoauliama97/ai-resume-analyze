import { eq } from 'drizzle-orm';
import { beforeEach, expect, test } from 'vitest';
import {
  handleDeleteAnalysis,
  handleGetAnalysis,
  handleListAnalyses,
  type ReadHandlerDeps,
} from '@/lib/api/read-handlers';
import { hashClientToken, CLIENT_COOKIE } from '@/lib/auth/client-token';
import { recommendations } from '@/lib/db/schema';
import {
  createAnalysis,
  upsertClient,
  type NewAnalysisRecord,
} from '@/lib/db/queries';
import { resetDb, testDb } from './helpers';
import { createMemoryStorage } from './storage-fake';

const PEPPER = 'read-test-pepper';

function record(clientId: string, fileName = 'resume.pdf'): NewAnalysisRecord {
  return {
    clientId,
    fileName,
    fileType: 'application/pdf',
    fileSize: 1024,
    resumeText: 'Ahmad Pratama — Frontend Engineer dengan pengalaman 6 tahun.',
    resumeFileKey: 'clients/test/resume.pdf',
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
          layer: 'job',
          category: 'J1',
          priority: 'medium',
          title: 'Tambahkan React',
          detail: 'React diminta di JD.',
          evidence: 'Tidak ditemukan.',
        },
      ],
    },
  };
}

async function seed(token: string, fileName?: string): Promise<string> {
  const clientId = await upsertClient(testDb, hashClientToken(token, PEPPER));
  return createAnalysis(testDb, record(clientId, fileName));
}

let memoryStorage: ReturnType<typeof createMemoryStorage>;

function deps(): ReadHandlerDeps {
  return { db: testDb, pepper: PEPPER, storage: memoryStorage.storage };
}

function request(token?: string): Request {
  return new Request('http://localhost/api/analyses', {
    headers: token ? { cookie: `${CLIENT_COOKIE}=${token}` } : {},
  });
}

beforeEach(async () => {
  await resetDb();
  memoryStorage = createMemoryStorage();
});

test('lists only the cookie owner analyses', async () => {
  await seed('token-a', 'a-one.pdf');
  await seed('token-a', 'a-two.pdf');
  await seed('token-b', 'b-secret.pdf');

  const response = await handleListAnalyses(request('token-a'), deps());
  const body = (await response.json()) as {
    analyses: Array<{ fileName: string }>;
  };

  expect(response.status).toBe(200);
  expect(body.analyses).toHaveLength(2);
  expect(body.analyses.map((item) => item.fileName).sort()).toEqual([
    'a-one.pdf',
    'a-two.pdf',
  ]);
  expect(JSON.stringify(body)).not.toContain('b-secret.pdf');
});

test('returns_404_for_another_clients_analysis', async () => {
  const id = await seed('token-a', 'private-name.pdf');

  const response = await handleGetAnalysis(request('token-b'), id, deps());
  const text = await response.text();

  expect(response.status).toBe(404);
  expect(text).not.toContain('private-name.pdf');
});

test('no cookie yields an empty list and 404 detail', async () => {
  const id = await seed('token-a');

  const list = await handleListAnalyses(request(), deps());
  const detail = await handleGetAnalysis(request(), id, deps());

  expect(list.status).toBe(200);
  expect(await list.json()).toEqual({ analyses: [] });
  expect(detail.status).toBe(404);
});

test('deletes the owner analysis with recommendations', async () => {
  const id = await seed('token-a');
  const first = await handleDeleteAnalysis(request('token-a'), id, deps());

  expect(first.status).toBe(200);
  expect(await first.json()).toEqual({ ok: true });
  expect(memoryStorage.removals).toEqual(['clients/test/resume.pdf']);

  const after = await handleGetAnalysis(request('token-a'), id, deps());
  expect(after.status).toBe(404);
  expect(
    await testDb.select().from(recommendations).where(eq(recommendations.analysisId, id)),
  ).toHaveLength(0);
});

test('does not delete another clients analysis', async () => {
  const id = await seed('token-a');

  const response = await handleDeleteAnalysis(request('token-b'), id, deps());

  expect(response.status).toBe(404);
  const detail = await handleGetAnalysis(request('token-a'), id, deps());
  expect(detail.status).toBe(200);
});

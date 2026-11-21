import { beforeEach, expect, test } from 'vitest';
import { handleAdminBulkDeleteAnalyses } from '@/lib/api/admin-handlers';
import { ADMIN_COOKIE, createAdminSession } from '@/lib/auth/admin';
import { analyses } from '@/lib/db/schema';
import {
  createAnalysis,
  getAdminDashboardStats,
  upsertClient,
  type NewAnalysisRecord,
} from '@/lib/db/queries';
import { resetDb, testDb } from './helpers';
import { createMemoryStorage } from './storage-fake';

const ADMIN_COOKIE_VALUE = `${ADMIN_COOKIE}=${createAdminSession('admin')}`;

function record(clientId: string, fileName: string, key: string): NewAnalysisRecord {
  return {
    clientId,
    fileName,
    fileType: 'application/pdf',
    fileSize: 1024,
    resumeText: 'Ahmad Pratama — Frontend Engineer dengan pengalaman 6 tahun.',
    resumeFileKey: key,
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
      recommendations: [],
    },
  };
}

function request(ids: string[], cookie?: string): Request {
  return new Request('http://localhost/api/admin/analyses', {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ ids }),
  });
}

beforeEach(async () => {
  await resetDb();
});

test('rejects unauthenticated bulk deletes', async () => {
  const storage = createMemoryStorage();
  const response = await handleAdminBulkDeleteAnalyses(request([]), {
    db: testDb,
    storage: storage.storage,
  });

  expect(response.status).toBe(401);
});

test('rejects invalid ids', async () => {
  const storage = createMemoryStorage();
  const response = await handleAdminBulkDeleteAnalyses(
    request(['not-a-uuid'], ADMIN_COOKIE_VALUE),
    { db: testDb, storage: storage.storage },
  );

  expect(response.status).toBe(400);
});

test('builds dashboard totals, active analyses, and average score', async () => {
  const clientId = await upsertClient(testDb, 'dashboard-hash');
  await createAnalysis(testDb, record(clientId, 'first.pdf', 'clients/test/first.pdf'));
  await createAnalysis(testDb, {
    ...record(clientId, 'second.pdf', 'clients/test/second.pdf'),
    overallScore: 90,
    globalScore: 90,
    datasetConsent: true,
  });

  const stats = await getAdminDashboardStats(testDb);

  expect(stats.totalAnalyses).toBe(2);
  expect(stats.totalClients).toBe(1);
  expect(stats.last24Hours).toBe(2);
  expect(stats.last7Days).toBe(2);
  expect(stats.datasetConsents).toBe(1);
  expect(stats.averageScore).toBe(83);
});

test('deletes selected analyses and their stored files', async () => {
  const clientId = await upsertClient(testDb, 'bulk-hash');
  const first = await createAnalysis(
    testDb,
    record(clientId, 'first.pdf', 'clients/test/first.pdf'),
  );
  const second = await createAnalysis(
    testDb,
    record(clientId, 'second.pdf', 'clients/test/second.pdf'),
  );
  await createAnalysis(
    testDb,
    record(clientId, 'keep.pdf', 'clients/test/keep.pdf'),
  );
  const storage = createMemoryStorage();

  const response = await handleAdminBulkDeleteAnalyses(
    request([first, second], ADMIN_COOKIE_VALUE),
    { db: testDb, storage: storage.storage },
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true, deleted: 2 });
  expect(storage.removals.sort()).toEqual([
    'clients/test/first.pdf',
    'clients/test/second.pdf',
  ]);
  expect(await testDb.select().from(analyses)).toHaveLength(1);
});

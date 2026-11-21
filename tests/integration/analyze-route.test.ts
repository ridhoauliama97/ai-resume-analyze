import { beforeEach, expect, test } from 'vitest';
import { analyses, clients, recommendations } from '@/lib/db/schema';
import { handleAnalyze, type AnalyzeHandlerDeps } from '@/lib/api/analyze-handler';
import { buildAnalyzeDeps } from '@/lib/api/deps';
import { CONSENT_VERSION } from '@/lib/constants';
import { getServerEnv } from '@/lib/env';
import { ResumeParseError } from '@/lib/parsing';
import { createRateLimiter } from '@/lib/rate-limit';
import type { AnalysisOutcome } from '@/lib/ai/analyze';
import { JOB_CATEGORY_CODES, type AiResult } from '@/lib/ai/schema';
import { resetDb, testDb } from './helpers';
import { createMemoryStorage } from './storage-fake';

function aiResult(): AiResult {
  return {
    categories: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'].map((code) => ({
      code,
      score: 80,
      reason: `Alasan ${code}`,
      evidence: `Bukti ${code}`,
    })),
    jobCategories: JOB_CATEGORY_CODES.map((code) => ({
      code,
      score: 70,
      reason: `Alasan ${code}`,
      evidence: `Bukti ${code}`,
    })),
    jobLayerNote: 'Dinilai berdasarkan JD.',
    keywords: {
      matched: ['TypeScript'],
      missing: ['React'],
      mustHaveMissing: ['React'],
      source: 'jd',
    },
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
  };
}

function outcome(overrides: Partial<AnalysisOutcome> = {}): AnalysisOutcome {
  return {
    globalScore: 80,
    jobScore: 70,
    overallScore: 76,
    band: 'green',
    jobLayerStatus: 'complete',
    resultJson: aiResult(),
    promptVersion: '2026-11-14-v1',
    marketContext: null,
    ...overrides,
  };
}

function pdfFile(): File {
  return new File([new TextEncoder().encode('%PDF-1.4\nresume')], 'resume.pdf', {
    type: 'application/pdf',
  });
}

function request(
  input: {
    file?: File | null;
    consent?: boolean;
    datasetConsent?: boolean;
    position?: string;
    jobDescription?: string;
    cookie?: string;
    ip?: string;
  } = {},
): Request {
  const form = new FormData();

  if (input.file !== null) {
    form.append('file', input.file ?? pdfFile(), 'resume.pdf');
  }
  if (input.consent !== false) {
    form.append('consent', 'true');
  }
  if (input.datasetConsent !== false) {
    form.append('datasetConsent', 'true');
  }
  if (input.position) {
    form.append('targetPosition', input.position);
  }
  if (input.jobDescription) {
    form.append('jobDescription', input.jobDescription);
  }

  const headers: Record<string, string> = {
    'x-forwarded-for': input.ip ?? '203.0.113.10',
  };
  if (input.cookie) {
    headers.cookie = input.cookie;
  }

  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    body: form,
    headers,
  });
}

function deps(overrides: Partial<AnalyzeHandlerDeps> = {}): AnalyzeHandlerDeps {
  return {
    db: testDb,
    analyze: async () => outcome(),
    parseFile: async () => ({
      text: 'Ahmad Pratama — Frontend Engineer. '.repeat(20),
      extension: 'pdf',
    }),
    clientLimiter: createRateLimiter({ limit: 100, windowMs: 3_600_000 }),
    ipLimiter: createRateLimiter({ limit: 100, windowMs: 3_600_000 }),
    storage: createMemoryStorage().storage,
    pepper: 'test-pepper',
    model: 'gemini-3.5-flash-lite',
    secureCookies: false,
    now: () => new Date('2026-11-14T10:00:00Z'),
    ...overrides,
  };
}

beforeEach(async () => {
  await resetDb();
});

test('creates analysis and sets anonymous cookie', async () => {
  const storage = createMemoryStorage();
  const response = await handleAnalyze(
    request({ position: 'Frontend Engineer', jobDescription: 'Menguasai React.' }),
    deps({ storage: storage.storage }),
  );

  expect(response.status).toBe(200);
  const body = (await response.json()) as { id: string };
  expect(body.id).toEqual(expect.any(String));

  const setCookie = response.headers.get('set-cookie');
  expect(setCookie).toContain('ra_client=');
  expect(setCookie).toContain('HttpOnly');

  const rows = await testDb.select().from(analyses);
  expect(rows).toHaveLength(1);
  expect(rows[0].datasetConsent).toBe(true);
  expect(rows[0].consentVersion).toBe(CONSENT_VERSION);
  expect(rows[0].targetPosition).toBe('Frontend Engineer');
  expect(rows[0].fileType).toBe('application/pdf');
  expect(rows[0].resumeFileKey).toBe(storage.uploads[0].key);
  expect(storage.uploads).toHaveLength(1);
  expect(storage.uploads[0].key).toMatch(/^clients\/[0-9a-f-]+\/[0-9a-f-]+\.pdf$/);
  expect(storage.uploads[0].contentType).toBe('application/pdf');
  expect(await testDb.select().from(recommendations)).toHaveLength(2);
});

test('reuses the client for the same cookie without creating a new client row', async () => {
  const first = await handleAnalyze(request(), deps());
  const cookie = first.headers.get('set-cookie')!.split(';')[0];

  const second = await handleAnalyze(request({ cookie }), deps());

  expect(second.status).toBe(200);
  expect(await testDb.select().from(clients)).toHaveLength(1);
  expect(await testDb.select().from(analyses)).toHaveLength(2);
});

test('rejects a request without consent and stores nothing', async () => {
  const response = await handleAnalyze(request({ consent: false }), deps());

  expect(response.status).toBe(400);
  const body = (await response.json()) as { error: { code: string } };
  expect(body.error.code).toBe('consent_required');
  expect(await testDb.select().from(analyses)).toHaveLength(0);
});

test('parse_failure_stores_no_row', async () => {
  const response = await handleAnalyze(
    request(),
    deps({
      parseFile: async () => {
        throw new ResumeParseError('empty', 'Teks resume terlalu pendek.');
      },
    }),
  );

  expect(response.status).toBe(422);
  const body = (await response.json()) as { error: { message: string } };
  expect(body.error.message).toMatch(/scan/i);
  expect(await testDb.select().from(analyses)).toHaveLength(0);
});

test('returns 502 when the AI layer fails and stores nothing', async () => {
  const response = await handleAnalyze(
    request(),
    deps({
      analyze: async () => {
        throw new Error('AI down');
      },
    }),
  );

  expect(response.status).toBe(502);
  const body = (await response.json()) as { error: { code: string } };
  expect(body.error.code).toBe('ai_unavailable');
  expect(await testDb.select().from(analyses)).toHaveLength(0);
});

test('keeps a storage copy when the parser detaches the buffer', async () => {
  const storage = createMemoryStorage();

  const response = await handleAnalyze(
    request(),
    deps({
      storage: storage.storage,
      parseFile: async ({ buffer }) => {
        (buffer.buffer as ArrayBuffer).transfer();
        return {
          text: 'Ahmad Pratama — Frontend Engineer. '.repeat(20),
          extension: 'pdf',
        };
      },
    }),
  );

  expect(response.status).toBe(200);
  expect(storage.uploads).toHaveLength(1);
  expect(storage.uploads[0].body.byteLength).toBeGreaterThan(0);
  expect(new TextDecoder().decode(storage.uploads[0].body.slice(0, 4))).toBe('%PDF');
});

test('storage failure stores no row', async () => {
  const storage = createMemoryStorage();
  storage.storage.upload = async () => {
    throw new Error('storage down');
  };

  const response = await handleAnalyze(request(), deps({ storage: storage.storage }));

  expect(response.status).toBe(502);
  const body = (await response.json()) as { error: { code: string } };
  expect(body.error.code).toBe('storage_unavailable');
  expect(await testDb.select().from(analyses)).toHaveLength(0);
});

test('enforces the per-client rate limit', async () => {
  const limited = deps({
    clientLimiter: createRateLimiter({ limit: 1, windowMs: 3_600_000 }),
  });
  const first = await handleAnalyze(request(), limited);
  const cookie = first.headers.get('set-cookie')!.split(';')[0];

  const second = await handleAnalyze(request({ cookie }), limited);

  expect(first.status).toBe(200);
  expect(second.status).toBe(429);
  expect(await testDb.select().from(analyses)).toHaveLength(1);
});

test('enforces the per-IP rate limit across different clients', async () => {
  const limited = deps({
    clientLimiter: createRateLimiter({ limit: 100, windowMs: 3_600_000 }),
    ipLimiter: createRateLimiter({ limit: 1, windowMs: 3_600_000 }),
  });

  const first = await handleAnalyze(request({ ip: '198.51.100.7' }), limited);
  const second = await handleAnalyze(request({ ip: '198.51.100.7' }), limited);

  expect(first.status).toBe(200);
  expect(second.status).toBe(429);
  expect(await testDb.select().from(analyses)).toHaveLength(1);
});

test('rejects AI_MOCK in production', () => {
  const env = {
    DATABASE_URL: 'postgres://localhost:5432/resume_analyzer_test',
    GEMINI_API_KEY: 'test-key',
    GEMINI_MODEL: 'gemini-3.5-flash-lite',
    CLIENT_TOKEN_PEPPER: 'pepper',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'change-me',
    SUPABASE_S3_ENDPOINT: 'https://example.supabase.co/storage/v1/s3',
    SUPABASE_S3_REGION: 'ap-northeast-1',
    SUPABASE_S3_ACCESS_KEY_ID: 'test-key',
    SUPABASE_S3_SECRET_ACCESS_KEY: 'test-secret',
    SUPABASE_STORAGE_BUCKET: 'resumes',
    AI_MOCK: '1',
    NODE_ENV: 'production',
  } as const;

  expect(() => getServerEnv(env)).toThrow();
  expect(() =>
    buildAnalyzeDeps({
      DATABASE_URL: env.DATABASE_URL,
      GEMINI_API_KEY: env.GEMINI_API_KEY,
      GEMINI_MODEL: env.GEMINI_MODEL,
      CLIENT_TOKEN_PEPPER: env.CLIENT_TOKEN_PEPPER,
      ADMIN_USERNAME: env.ADMIN_USERNAME,
      ADMIN_PASSWORD: env.ADMIN_PASSWORD,
      SUPABASE_S3_ENDPOINT: env.SUPABASE_S3_ENDPOINT,
      SUPABASE_S3_REGION: env.SUPABASE_S3_REGION,
      SUPABASE_S3_ACCESS_KEY_ID: env.SUPABASE_S3_ACCESS_KEY_ID,
      SUPABASE_S3_SECRET_ACCESS_KEY: env.SUPABASE_S3_SECRET_ACCESS_KEY,
      SUPABASE_STORAGE_BUCKET: env.SUPABASE_STORAGE_BUCKET,
      AI_MOCK: '1',
      NODE_ENV: 'production',
    }),
  ).toThrow();
});

import { NextResponse } from 'next/server';
import type { AnalysisOutcome } from '@/lib/ai/analyze';
import {
  CLIENT_COOKIE,
  clientCookieOptions,
  createClientToken,
  hashClientToken,
  readClientToken,
} from '@/lib/auth/client-token';
import { CONSENT_VERSION } from '@/lib/constants';
import type { Db } from '@/lib/db/client';
import { createAnalysis, upsertClient } from '@/lib/db/queries';
import { ResumeParseError, type ResumeExtension } from '@/lib/parsing';
import type { RateLimiter } from '@/lib/rate-limit';

export type AnalyzeHandlerDeps = {
  db: Db;
  analyze: (input: {
    resumeText: string;
    targetPosition?: string | null;
    jobDescription?: string | null;
  }) => Promise<AnalysisOutcome>;
  parseFile: (file: {
    buffer: Uint8Array;
    fileName: string;
    mimeType?: string;
  }) => Promise<{ text: string; extension: ResumeExtension }>;
  clientLimiter: RateLimiter;
  ipLimiter: RateLimiter;
  pepper: string;
  model: string;
  secureCookies: boolean;
  now?: () => Date;
};

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

function textField(form: FormData, name: string): string | null {
  const value = form.get(name);
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeFileName(name: string): string {
  const base = name.split(/[\/]/).pop()?.trim() || 'resume';
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  return (cleaned || 'resume').slice(0, 255);
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    if (ips.length > 0) {
      return ips[ips.length - 1];
    }
  }

  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

const PARSE_ERROR_MESSAGES: Record<ResumeParseError['code'], string> = {
  unsupported_type: 'Format file tidak didukung. Unggah berkas PDF, DOCX, atau DOC.',
  too_large: 'Ukuran berkas melebihi batas 10 MB.',
  empty: 'Resume tidak bisa dibaca; kemungkinan hasil scan dan OCR belum didukung.',
  corrupt: 'Berkas tidak bisa dibaca. Pastikan berkas tidak rusak atau terenkripsi.',
};

export async function handleAnalyze(
  request: Request,
  deps: AnalyzeHandlerDeps,
): Promise<NextResponse> {
  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return errorResponse(400, 'invalid_body', 'Permintaan tidak valid.');
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return errorResponse(400, 'file_required', 'Unggah berkas resume terlebih dahulu.');
  }

  if (form.get('consent') !== 'true') {
    return errorResponse(
      400,
      'consent_required',
      'Persetujuan pemrosesan dan penyimpanan resume diperlukan.',
    );
  }

  const datasetConsent = form.get('datasetConsent') === 'true';
  const targetPosition = textField(form, 'targetPosition');
  const jobDescription = textField(form, 'jobDescription');

  const existingToken = readClientToken(request);
  const token = existingToken ?? createClientToken();
  const tokenHash = hashClientToken(token, deps.pepper);

  if (!deps.clientLimiter.check(tokenHash)) {
    return errorResponse(
      429,
      'rate_limited',
      'Batas analisis per jam tercapai. Coba lagi nanti.',
    );
  }

  if (!deps.ipLimiter.check(clientIp(request))) {
    return errorResponse(
      429,
      'rate_limited',
      'Batas analisis per jam tercapai. Coba lagi nanti.',
    );
  }

  const fileName = sanitizeFileName(file.name || 'resume');
  let parsed: { text: string; extension: ResumeExtension };

  try {
    parsed = await deps.parseFile({
      buffer: new Uint8Array(await file.arrayBuffer()),
      fileName,
      mimeType: file.type || undefined,
    });
  } catch (error) {
    if (error instanceof ResumeParseError) {
      const status = error.code === 'unsupported_type' || error.code === 'too_large' ? 400 : 422;
      return errorResponse(status, error.code, PARSE_ERROR_MESSAGES[error.code]);
    }

    return errorResponse(
      422,
      'parse_failed',
      'Resume tidak bisa dibaca. Pastikan berkas tidak rusak atau terenkripsi.',
    );
  }

  let outcome: AnalysisOutcome;

  try {
    outcome = await deps.analyze({
      resumeText: parsed.text,
      targetPosition,
      jobDescription,
    });
  } catch {
    return errorResponse(
      502,
      'ai_unavailable',
      'Layanan AI sedang sibuk. Coba lagi beberapa saat lagi.',
    );
  }

  try {
    const clientId = await upsertClient(deps.db, tokenHash);
    const id = await createAnalysis(deps.db, {
      clientId,
      fileName,
      fileType: file.type || parsed.extension,
      fileSize: file.size,
      resumeText: parsed.text,
      targetPosition,
      jobDescription,
      marketContext: outcome.marketContext,
      jobLayerStatus: outcome.jobLayerStatus,
      promptVersion: outcome.promptVersion,
      model: deps.model,
      globalScore: outcome.globalScore,
      jobScore: outcome.jobScore,
      overallScore: outcome.overallScore,
      band: outcome.band,
      datasetConsent,
      consentVersion: CONSENT_VERSION,
      consentedAt: deps.now?.() ?? new Date(),
      resultJson: outcome.resultJson,
    });

    const response = NextResponse.json({ id }, { status: 200 });

    if (!existingToken) {
      response.cookies.set(CLIENT_COOKIE, token, clientCookieOptions(deps.secureCookies));
    }

    return response;
  } catch {
    return errorResponse(
      500,
      'internal_error',
      'Terjadi kesalahan saat menyimpan analisis. Coba lagi.',
    );
  }
}

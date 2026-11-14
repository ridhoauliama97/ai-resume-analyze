import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hashClientToken, readClientToken } from '@/lib/auth/client-token';
import { getClientByTokenHash, saveFeedback } from '@/lib/db/queries';
import type { ReadHandlerDeps } from './read-handlers';

const feedbackSchema = z
  .object({
    recommendationId: z.string().uuid().optional(),
    rating: z.union([z.literal(-1), z.literal(1)]).optional(),
    comment: z.string().trim().min(1).max(2_000).optional(),
  })
  .refine((value) => value.rating !== undefined || value.comment !== undefined, {
    message: 'Minimal salah satu dari rating atau komentar harus diisi.',
  });

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

function notFound(): NextResponse {
  return errorResponse(404, 'not_found', 'Analisis tidak ditemukan.');
}

export async function handleFeedback(
  request: Request,
  analysisId: string,
  deps: ReadHandlerDeps,
): Promise<NextResponse> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return errorResponse(400, 'invalid_body', 'Permintaan feedback tidak valid.');
  }

  const parsed = feedbackSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, 'invalid_feedback', 'Data feedback tidak valid.');
  }

  const token = readClientToken(request);
  if (!token) {
    return notFound();
  }

  const clientId = await getClientByTokenHash(deps.db, hashClientToken(token, deps.pepper));
  if (!clientId) {
    return notFound();
  }

  const result = await saveFeedback(deps.db, {
    analysisId,
    clientId,
    ...parsed.data,
  });

  if (result === 'not_found') {
    return notFound();
  }

  if (result === 'invalid') {
    return errorResponse(
      400,
      'invalid_feedback',
      'Rekomendasi tidak sesuai dengan analisis ini.',
    );
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/auth/admin';
import type { Db } from '@/lib/db/client';
import {
  deleteAnalysisById,
  getAnalysisById,
  listAllAnalyses,
} from '@/lib/db/queries';
import type { ResumeStorage } from '@/lib/storage/types';

export type AdminHandlerDeps = {
  db: Db;
  storage: ResumeStorage;
};

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: { code: 'unauthorized', message: 'Akses admin diperlukan.' } },
    { status: 401 },
  );
}

function notFound(): NextResponse {
  return NextResponse.json(
    { error: { code: 'not_found', message: 'Analisis tidak ditemukan.' } },
    { status: 404 },
  );
}

export function isAdminRequest(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return verifyAdminSession(match ? decodeURIComponent(match[1]) : undefined);
}

export async function handleAdminListAnalyses(
  request: Request,
  deps: AdminHandlerDeps,
): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  return NextResponse.json({ analyses: await listAllAnalyses(deps.db) });
}

export async function handleAdminGetAnalysis(
  request: Request,
  id: string,
  deps: AdminHandlerDeps,
): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  const analysis = await getAnalysisById(deps.db, id);
  if (!analysis) {
    return notFound();
  }

  return NextResponse.json({ analysis });
}

export async function handleAdminDeleteAnalysis(
  request: Request,
  id: string,
  deps: AdminHandlerDeps,
): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  const analysis = await getAnalysisById(deps.db, id);
  if (!analysis) {
    return notFound();
  }

  const deleted = await deleteAnalysisById(deps.db, id);
  if (!deleted) {
    return notFound();
  }

  if (analysis.resumeFileKey) {
    await deps.storage.remove(analysis.resumeFileKey).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { hashClientToken, readClientToken } from '@/lib/auth/client-token';
import type { Db } from '@/lib/db/client';
import {
  deleteAnalysisForClient,
  getAnalysisForClient,
  getClientByTokenHash,
  listAnalysesForClient,
} from '@/lib/db/queries';

export type ReadHandlerDeps = {
  db: Db;
  pepper: string;
};

async function resolveClientId(
  request: Request,
  deps: ReadHandlerDeps,
): Promise<string | null> {
  const token = readClientToken(request);
  if (!token) {
    return null;
  }

  return getClientByTokenHash(deps.db, hashClientToken(token, deps.pepper));
}

function notFound(): NextResponse {
  return NextResponse.json(
    { error: { code: 'not_found', message: 'Analisis tidak ditemukan.' } },
    { status: 404 },
  );
}

export async function handleListAnalyses(
  request: Request,
  deps: ReadHandlerDeps,
): Promise<NextResponse> {
  const clientId = await resolveClientId(request, deps);

  if (!clientId) {
    return NextResponse.json({ analyses: [] });
  }

  return NextResponse.json({ analyses: await listAnalysesForClient(deps.db, clientId) });
}

export async function handleGetAnalysis(
  request: Request,
  id: string,
  deps: ReadHandlerDeps,
): Promise<NextResponse> {
  const clientId = await resolveClientId(request, deps);

  if (!clientId) {
    return notFound();
  }

  const analysis = await getAnalysisForClient(deps.db, id, clientId);

  if (!analysis) {
    return notFound();
  }

  return NextResponse.json({ analysis });
}

export async function handleDeleteAnalysis(
  request: Request,
  id: string,
  deps: ReadHandlerDeps,
): Promise<NextResponse> {
  const clientId = await resolveClientId(request, deps);

  if (!clientId) {
    return notFound();
  }

  const deleted = await deleteAnalysisForClient(deps.db, id, clientId);

  if (!deleted) {
    return notFound();
  }

  return NextResponse.json({ ok: true });
}

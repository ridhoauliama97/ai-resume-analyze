import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/auth/admin';
import type { Db } from '@/lib/db/client';
import {
  deleteAnalysesByIds,
  deleteAnalysisById,
  getAnalysisById,
  listAllAnalyses,
} from '@/lib/db/queries';
import type { ResumeStorage } from '@/lib/storage/types';

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(1000),
});

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

export async function handleAdminBulkDeleteAnalyses(
  request: Request,
  deps: AdminHandlerDeps,
): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'invalid_body', message: 'Permintaan hapus tidak valid.' } },
      { status: 400 },
    );
  }

  const parsed = bulkDeleteSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'invalid_ids',
          message: 'Pilih 1–1000 analisis yang valid untuk dihapus.',
        },
      },
      { status: 400 },
    );
  }

  const deleted = await deleteAnalysesByIds(deps.db, parsed.data.ids);

  await Promise.all(
    deleted.map((row) =>
      row.resumeFileKey
        ? deps.storage.remove(row.resumeFileKey).catch(() => undefined)
        : Promise.resolve(),
    ),
  );

  return NextResponse.json({ ok: true, deleted: deleted.length });
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

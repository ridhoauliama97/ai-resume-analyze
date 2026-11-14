import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { cn } from 'cn';
import { DeleteAnalysisButton } from '@/components/delete-analysis-button';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentClientId } from '@/lib/auth/server';
import { getDb } from '@/lib/db/client';
import { listAnalysesForClient } from '@/lib/db/queries';
import { formatBand, formatDateId, formatScore } from '@/lib/format';
import type { Band } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Riwayat analisis',
};

function bandClass(band: Band): string {
  if (band === 'green') {
    return 'bg-emerald-600/10 text-emerald-800 dark:text-emerald-300';
  }
  if (band === 'yellow') {
    return 'bg-amber-500/10 text-amber-800 dark:text-amber-300';
  }
  return 'bg-red-600/10 text-red-800 dark:text-red-300';
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
      <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

async function HistoryList() {
  const clientId = await getCurrentClientId();
  const analyses = clientId ? await listAnalysesForClient(getDb(), clientId) : [];

  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 py-4">
          <div className="flex flex-col gap-1">
            <p className="font-medium">Belum ada analisis.</p>
            <p className="text-sm text-muted-foreground">
              Unggah resume pertamamu untuk melihat skor, rincian kategori, dan saran perbaikan.
            </p>
          </div>
          <Link href="/" className={cn(buttonVariants({ size: 'sm' }))}>
            Analisis resume sekarang
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {analyses.map((analysis) => (
        <li key={analysis.id}>
          <Card size="sm">
            <CardContent className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-1">
                <Link
                  href={`/analysis/${analysis.id}`}
                  className="truncate font-medium underline-offset-4 hover:underline"
                >
                  {analysis.fileName}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatDateId(analysis.createdAt.toISOString())}
                  {analysis.targetPosition ? ` · ${analysis.targetPosition}` : null}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge className={bandClass(analysis.band)}>
                  {formatBand(analysis.band)} · {formatScore(analysis.overallScore)}
                </Badge>
                <Link
                  href={`/analysis/${analysis.id}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  Lihat report
                </Link>
                <DeleteAnalysisButton analysisId={analysis.id} />
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export default function HistoryPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Riwayat analisis</h1>
          <p className="text-sm text-muted-foreground">
            Analisis yang tersimpan di browser ini. Hapus kapan saja untuk menghapus data secara
            permanen.
          </p>
        </header>

        <Suspense fallback={<HistorySkeleton />}>
          <HistoryList />
        </Suspense>
      </div>
    </main>
  );
}

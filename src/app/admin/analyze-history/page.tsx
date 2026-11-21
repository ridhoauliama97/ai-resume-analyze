import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AnalysesDataTable } from '@/components/analyses-data-table';
import { getCurrentAdmin } from '@/lib/auth/admin';
import { getDb } from '@/lib/db/client';
import { listAnalysesForAdmin } from '@/lib/db/queries';
import { formatBand, formatDateId } from '@/lib/format';
import type { AdminAnalysisRow } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Riwayat Analisa',
};

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-16 w-72 animate-pulse rounded-xl bg-muted" aria-busy="true" />
      <div className="h-96 w-full animate-pulse rounded-xl bg-muted" aria-busy="true" />
    </div>
  );
}

async function HistoryContent() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect('/auth/admin');
  }

  const analyses = await listAnalysesForAdmin(getDb());
  const rows: AdminAnalysisRow[] = analyses.map((analysis) => ({
    id: analysis.id,
    fileName: analysis.fileName,
    targetPosition: analysis.targetPosition,
    overallScore: analysis.overallScore,
    band: analysis.band,
    datasetConsent: analysis.datasetConsent,
    createdAt: analysis.createdAt.toISOString(),
    searchText: [
      analysis.fileName,
      analysis.targetPosition ?? '',
      formatDateId(analysis.createdAt.toISOString()),
      formatBand(analysis.band),
      analysis.id,
    ]
      .join(' ')
      .toLowerCase(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Riwayat Analisa
        </h1>
        <p className="text-sm text-muted-foreground">
          Seluruh riwayat analisis dari user/client. Masuk sebagai {admin}.
        </p>
      </header>

      <AnalysesDataTable data={rows} />
    </div>
  );
}

export default function AnalyzeHistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryContent />
    </Suspense>
  );
}

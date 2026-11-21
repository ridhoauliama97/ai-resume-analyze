import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AnalysisReportView } from '@/components/analysis-report-view';
import { getCurrentClientId } from '@/lib/auth/server';
import { getDb } from '@/lib/db/client';
import { getAnalysisForClient } from '@/lib/db/queries';

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-8 w-2/3 animate-pulse rounded-md bg-muted" />
      <div className="h-48 w-full animate-pulse rounded-xl bg-muted" />
      <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

async function AnalysisReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = await getCurrentClientId();

  if (!clientId) {
    notFound();
  }

  const analysis = await getAnalysisForClient(getDb(), id, clientId);

  if (!analysis) {
    notFound();
  }

  return <AnalysisReportView analysis={analysis} />;
}

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Suspense fallback={<ReportSkeleton />}>
        <AnalysisReport params={params} />
      </Suspense>
    </main>
  );
}

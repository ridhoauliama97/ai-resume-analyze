import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AnalysisReportView } from '@/components/analysis-report-view';
import { getCurrentAdmin } from '@/lib/auth/admin';
import { getDb } from '@/lib/db/client';
import { getAnalysisById } from '@/lib/db/queries';

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-8 w-2/3 animate-pulse rounded-md bg-muted" />
      <div className="h-48 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

async function AdminReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect('/auth/admin');
  }

  const analysis = await getAnalysisById(getDb(), id);

  if (!analysis) {
    notFound();
  }

  return <AnalysisReportView analysis={analysis} admin />;
}

export default function AdminAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <Suspense fallback={<ReportSkeleton />}>
        <AdminReport params={params} />
      </Suspense>
    </div>
  );
}

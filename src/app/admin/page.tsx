import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteAnalysisButton } from '@/components/delete-analysis-button';
import { getCurrentAdmin } from '@/lib/auth/admin';
import { getDb } from '@/lib/db/client';
import { listAllAnalyses } from '@/lib/db/queries';
import { formatBand, formatDateId, formatScore } from '@/lib/format';
import type { Band } from '@/lib/types';

function bandClass(band: Band): string {
  if (band === 'green') return 'bg-emerald-600/10 text-emerald-800 dark:text-emerald-300';
  if (band === 'yellow') return 'bg-amber-500/10 text-amber-800 dark:text-amber-300';
  return 'bg-red-600/10 text-red-800 dark:text-red-300';
}

function DashboardSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-xl bg-muted" aria-busy="true" />;
}

async function AdminDashboard() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/auth/admin');
  }

  const analyses = await listAllAnalyses(getDb());

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard admin</h1>
          <p className="text-sm text-muted-foreground">
            Seluruh riwayat analisis. Masuk sebagai {admin}.
          </p>
        </div>
        <form action="/api/auth/admin/logout" method="post">
          <button
            type="submit"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Keluar
          </button>
        </form>
      </header>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Belum ada analisis.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Berkas</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Posisi</th>
                <th className="px-4 py-3 font-medium">Skor</th>
                <th className="px-4 py-3 font-medium">Band</th>
                <th className="px-4 py-3 font-medium">Dataset</th>
                <th className="min-w-[140px] px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((analysis) => (
                <tr key={analysis.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{analysis.fileName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDateId(analysis.createdAt.toISOString())}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {analysis.targetPosition || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    {formatScore(analysis.overallScore)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge className={bandClass(analysis.band)}>{formatBand(analysis.band)}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {analysis.datasetConsent ? 'Ya' : 'Tidak'}
                  </td>
                  <td className="min-w-[140px] px-4 py-3">
                    <div className="flex flex-nowrap items-center gap-2">
                      <Link
                        href={`/admin/analyses/${analysis.id}`}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        Lihat
                      </Link>
                      <DeleteAnalysisButton analysisId={analysis.id} compact admin />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboard />
      </Suspense>
    </main>
  );
}

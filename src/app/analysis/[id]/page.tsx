import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { cn } from 'cn';
import { CategoryBreakdown } from '@/components/category-breakdown';
import { DeleteAnalysisButton } from '@/components/delete-analysis-button';
import { FeedbackCommentForm } from '@/components/feedback-comment-form';
import { RecommendationCard } from '@/components/recommendation-card';
import { ScoreGauge } from '@/components/score-gauge';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getCurrentClientId } from '@/lib/auth/server';
import { getDb } from '@/lib/db/client';
import { getAnalysisForClient, type AnalysisDetail, type Feedback } from '@/lib/db/queries';
import { formatBand, formatDateId, formatScore } from '@/lib/format';
import { GLOBAL_WEIGHTS, JOB_WEIGHTS } from '@/lib/scoring';

const SOURCE_LABELS: Record<'jd' | 'market' | 'inferred', string> = {
  jd: 'Sumber: job description',
  market: 'Sumber: konteks pasar',
  inferred: 'Sumber: pengetahuan umum model',
};

function ratingFor(feedbackRows: Feedback[], recommendationId: string): -1 | 1 | null {
  for (const row of feedbackRows) {
    if (row.recommendationId !== recommendationId || row.rating === null) {
      continue;
    }

    return row.rating === 1 ? 1 : row.rating === -1 ? -1 : null;
  }

  return null;
}

function KeywordChips({
  title,
  keywords,
  tone,
}: {
  title: string;
  keywords: string[];
  tone: 'matched' | 'missing' | 'must-have';
}) {
  if (keywords.length === 0) {
    return null;
  }

  const toneClass =
    tone === 'matched'
      ? 'border-emerald-600/40 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300'
      : tone === 'missing'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300'
        : 'border-red-600/40 bg-red-600/10 text-red-800 dark:text-red-300';

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium">{title}</h4>
      <ul className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <li
            key={keyword}
            className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium', toneClass)}
          >
            {keyword}
          </li>
        ))}
      </ul>
    </div>
  );
}

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

  const result = analysis.resultJson;
  const jobCategories = result.jobCategories ?? [];
  const keywords = result.keywords ?? null;
  const bandLabel = formatBand(analysis.band);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <nav className="flex flex-wrap gap-4 text-sm">
          <Link href="/history" className="underline underline-offset-4">
            ← Kembali ke riwayat
          </Link>
          <Link href="/" className="underline underline-offset-4">
            Analisis lagi
          </Link>
        </nav>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Report analisis resume
          </h1>
          <p className="text-sm text-muted-foreground">
            {analysis.fileName} · {formatDateId(analysis.createdAt.toISOString())}
            {analysis.targetPosition ? ` · Posisi target: ${analysis.targetPosition}` : null}
          </p>
        </div>
      </header>

      <ScoreSummary analysis={analysis} bandLabel={bandLabel} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rincian skor global</CardTitle>
            <CardDescription>
              Tujuh kategori ATS yang selalu dinilai, dengan bobot dan alasan dari model.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown categories={result.categories} weights={GLOBAL_WEIGHTS} />
          </CardContent>
        </Card>

        {analysis.jobScore !== null ? (
          <Card>
            <CardHeader>
              <CardTitle>Skor job-specific</CardTitle>
              <CardDescription>
                Relevansi resume terhadap posisi atau job description yang Anda berikan.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <p className="text-3xl font-semibold tabular-nums">
                {formatScore(analysis.jobScore)}
              </p>
              {jobCategories.length > 0 ? (
                <CategoryBreakdown categories={jobCategories} weights={JOB_WEIGHTS} />
              ) : null}
              {keywords ? (
                <div className="flex flex-col gap-4 border-t pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Keyword & gap</h3>
                    <span className="text-xs text-muted-foreground">
                      {SOURCE_LABELS[keywords.source]}
                    </span>
                  </div>
                  <KeywordChips title="Cocok" keywords={keywords.matched} tone="matched" />
                  <KeywordChips title="Belum ada" keywords={keywords.missing} tone="missing" />
                  <KeywordChips
                    title="Must-have yang belum terpenuhi"
                    keywords={keywords.mustHaveMissing}
                    tone="must-have"
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Anjuran perbaikan</h2>
          <p className="text-sm text-muted-foreground">
            Diurutkan dari prioritas tertinggi. Beri vote agar kualitas saran bisa terus
            ditingkatkan.
          </p>
        </div>

        {analysis.recommendations.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {analysis.recommendations.map((recommendation) => (
              <li key={recommendation.id}>
                <RecommendationCard
                  recommendation={recommendation}
                  initialRating={ratingFor(analysis.feedback, recommendation.id)}
                  analysisId={analysis.id}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tidak ada anjuran tambahan untuk analisis ini.
          </p>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Feedback keseluruhan</CardTitle>
          <CardDescription>
            Opsional. Masukan Anda membantu meningkatkan kualitas penilaian.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackCommentForm analysisId={analysis.id} />
        </CardContent>
      </Card>

      <section className="flex flex-wrap items-center gap-3 border-t pt-6">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Analisis resume lain
        </Link>
        <Link
          href="/history"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          Kembali ke riwayat
        </Link>
        <div className="ml-auto">
          <DeleteAnalysisButton analysisId={analysis.id} />
        </div>
      </section>
    </div>
  );
}

function ScoreSummary({
  analysis,
  bandLabel,
}: {
  analysis: AnalysisDetail;
  bandLabel: string;
}) {
  const result = analysis.resultJson;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 py-2 sm:flex-row sm:items-center sm:justify-between">
        <ScoreGauge score={analysis.overallScore} band={analysis.band} label={bandLabel} />

        <div className="flex max-w-md flex-col gap-3 text-center sm:text-left">
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge
              className={cn(
                analysis.band === 'green' &&
                  'bg-emerald-600/10 text-emerald-800 dark:text-emerald-300',
                analysis.band === 'yellow' &&
                  'bg-amber-500/10 text-amber-800 dark:text-amber-300',
                analysis.band === 'red' && 'bg-red-600/10 text-red-800 dark:text-red-300',
              )}
            >
              {bandLabel}
            </Badge>
            <Badge variant="outline">Skor total {formatScore(analysis.overallScore)}</Badge>
          </div>

          <p className="text-sm">
            <span className="font-medium">Skor Global {formatScore(analysis.globalScore)}</span>
            {analysis.jobScore !== null
              ? ` · Job-specific ${formatScore(analysis.jobScore)}`
              : null}
          </p>

          {analysis.jobLayerStatus === 'inferred' ? (
            <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              Penilaian job-specific ini bersifat perkiraan berdasarkan ekspektasi pasar dan
              pengetahuan umum tentang peran, karena job description tidak diberikan.
            </p>
          ) : null}

          {analysis.jobLayerStatus === 'unavailable' ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Penilaian job-specific tidak tersedia. Skor total dihitung dari lapis global saja.
            </p>
          ) : null}

          {result.jobLayerNote && analysis.jobLayerStatus !== 'none' ? (
            <p className="text-sm text-muted-foreground">{result.jobLayerNote}</p>
          ) : null}

          {analysis.jobLayerStatus === 'none' ? (
            <p className="text-sm text-muted-foreground">
              Tambahkan posisi target atau job description saat menganalisis untuk mendapat skor
              job-specific.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Suspense fallback={<ReportSkeleton />}>
        <AnalysisReport params={params} />
      </Suspense>
    </main>
  );
}

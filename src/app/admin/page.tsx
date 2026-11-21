import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import {
  ActivityIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  EyeIcon,
  FileTextIcon,
  GaugeIcon,
  HistoryIcon,
  TrendingUpIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import { BandBadge } from '@/components/band-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { getWebAnalyticsSummary } from '@/lib/analytics/vercel';
import { getCurrentAdmin } from '@/lib/auth/admin';
import { getDb } from '@/lib/db/client';
import {
  getAdminDashboardStats,
  listRecentAnalyses,
} from '@/lib/db/queries';
import { getServerEnv } from '@/lib/env';
import { formatDateTimeId, formatScore } from '@/lib/format';

export const metadata = {
  title: 'Dashboard',
};

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-20 w-full max-w-xl animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </CardTitle>
        <CardAction>
          <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
            <Icon aria-hidden="true" className="size-4" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function WebAnalyticsEmpty({
  status,
}: {
  status: 'not_configured' | 'error';
}) {
  const isError = status === 'error';

  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ActivityIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          {isError
            ? 'Data kunjungan belum tersedia'
            : 'Web analytics belum terhubung'}
        </EmptyTitle>
        <EmptyDescription>
          {isError
            ? 'Integrasi aktif, tetapi Vercel belum mengembalikan data. Coba muat ulang halaman ini.'
            : 'Aktifkan Vercel Web Analytics API untuk menampilkan kunjungan halaman dan pengunjung unik.'}
        </EmptyDescription>
      </EmptyHeader>
      {!isError ? (
        <EmptyContent>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a
                href="https://vercel.com/docs/analytics/web-analytics-api"
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            Pelajari integrasi
            <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

async function DashboardContent() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect('/auth/admin');
  }

  const db = getDb();
  const [stats, recent, analytics] = await Promise.all([
    getAdminDashboardStats(db),
    listRecentAnalyses(db),
    getWebAnalyticsSummary(getServerEnv()),
  ]);

  const numberFormat = new Intl.NumberFormat('id-ID');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Ringkasan admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Pantau aktivitas website dan analisa user terakhir. Masuk sebagai {admin}.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/analyze-history" />}
        >
          <HistoryIcon data-icon="inline-start" aria-hidden="true" />
          Lihat riwayat
        </Button>
      </header>

      <section
        aria-label="Statistik analisa"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total analisa"
          value={numberFormat.format(stats.totalAnalyses)}
          hint={`${numberFormat.format(stats.datasetConsents)} izin dataset`}
          icon={FileTextIcon}
        />
        <StatCard
          label="Pengguna unik"
          value={numberFormat.format(stats.totalClients)}
          hint="Pengguna anonim per browser"
          icon={UsersIcon}
        />
        <StatCard
          label="Analisa 7 hari"
          value={numberFormat.format(stats.last7Days)}
          hint={`${numberFormat.format(stats.last24Hours)} dalam 24 jam terakhir`}
          icon={TrendingUpIcon}
        />
        <StatCard
          label="Skor rata-rata"
          value={stats.averageScore === null ? '—' : formatScore(stats.averageScore)}
          hint={`Dari ${numberFormat.format(stats.totalAnalyses)} analisa`}
          icon={GaugeIcon}
        />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Web analytics</CardTitle>
            <CardDescription>
              Kunjungan halaman dan pengunjung unik dari Vercel.
            </CardDescription>
            {analytics.status === 'ok' ? (
              <CardAction>
                <Badge variant="secondary">30 hari</Badge>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent>
            {analytics.status === 'ok' ? (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-4">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <EyeIcon aria-hidden="true" className="size-3.5" />
                      Page views
                    </span>
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {numberFormat.format(analytics.pageviews)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-4">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UsersIcon aria-hidden="true" className="size-3.5" />
                      Pengunjung
                    </span>
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {numberFormat.format(analytics.visitors)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sumber: Vercel Web Analytics · 30 hari terakhir.
                </p>
              </div>
            ) : (
              <WebAnalyticsEmpty status={analytics.status} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analisa terakhir</CardTitle>
            <CardDescription>
              {recent.length > 0
                ? `${recent.length} analisa terbaru yang masuk.`
                : 'Belum ada analisa yang masuk.'}
            </CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/admin/analyze-history" />}
              >
                Semua
                <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileTextIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Belum ada analisa</EmptyTitle>
                  <EmptyDescription>
                    Analisa user akan muncul di sini setelah resume diunggah.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="flex flex-col divide-y">
                {recent.map((analysis) => (
                  <li key={analysis.id}>
                    <Link
                      href={`/admin/analyses/${analysis.id}`}
                      className="group flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <FileTextIcon aria-hidden="true" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium group-hover:underline">
                          {analysis.fileName}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {analysis.targetPosition || 'Tanpa posisi target'} ·{' '}
                          {formatDateTimeId(analysis.createdAt.toISOString())}
                        </span>
                      </span>
                      <BandBadge band={analysis.band} />
                      <ChevronRightIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

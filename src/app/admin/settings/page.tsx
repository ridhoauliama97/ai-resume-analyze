import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SettingsForm } from '@/components/settings-form';
import { getCurrentAdmin } from '@/lib/auth/admin';
import { getDb } from '@/lib/db/client';
import { getSiteSettings } from '@/lib/db/queries';
import { getServerEnv } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Pengaturan',
};

function SettingsSkeleton() {
  return <div className="h-72 w-full animate-pulse rounded-xl bg-muted" aria-busy="true" />;
}

async function SettingsContent() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect('/auth/admin');
  }

  const settings = await getSiteSettings(getDb());
  const env = getServerEnv();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola identitas website dan opsi AI yang digunakan.
        </p>
      </header>
      <SettingsForm initialSettings={settings} currentModel={env.GEMINI_MODEL} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

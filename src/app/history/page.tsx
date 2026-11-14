import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentAdmin } from '@/lib/auth/admin';

async function HistoryRedirect(): Promise<null> {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect('/admin');
  }

  redirect('/');
  return null;
}

export default function HistoryPage() {
  return (
    <Suspense fallback={null}>
      <HistoryRedirect />
    </Suspense>
  );
}

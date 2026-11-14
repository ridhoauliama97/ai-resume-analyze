'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function DeleteAnalysisButton({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    const confirmed = window.confirm(
      'Hapus analisis ini? Riwayat, rekomendasi, dan feedback terkait akan dihapus permanen.',
    );

    if (!confirmed) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/analyses/${analysisId}`, { method: 'DELETE' });

      if (!response.ok) {
        setError('Analisis gagal dihapus. Coba lagi.');
        return;
      }

      router.push('/history');
      router.refresh();
    } catch {
      setError('Analisis gagal dihapus. Coba lagi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={pending}
      >
        {pending ? 'Menghapus...' : 'Hapus analisis'}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

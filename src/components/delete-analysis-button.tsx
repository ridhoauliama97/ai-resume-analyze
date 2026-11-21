'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeleteAnalysisButton({
  analysisId,
  compact = false,
  admin = false,
}: {
  analysisId: string;
  compact?: boolean;
  admin?: boolean;
}) {
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
      const endpoint = admin
        ? `/api/admin/analyses/${analysisId}`
        : `/api/analyses/${analysisId}`;
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (!response.ok) {
        setError('Analisis gagal dihapus. Coba lagi.');
        return;
      }

      router.push(admin ? '/admin' : '/history');
      router.refresh();
    } catch {
      setError('Analisis gagal dihapus. Coba lagi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={compact ? 'inline-flex' : 'flex flex-col items-start gap-2'}>
      <Button
        type="button"
        variant="destructive"
        size={compact ? 'icon-sm' : 'sm'}
        onClick={onDelete}
        disabled={pending}
        aria-label={compact ? 'Hapus analisis' : undefined}
        title={compact ? 'Hapus analisis' : undefined}
      >
        {compact ? (
          <Trash2 aria-hidden="true" className="size-3.5" />
        ) : pending ? (
          'Menghapus...'
        ) : (
          'Hapus analisis'
        )}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

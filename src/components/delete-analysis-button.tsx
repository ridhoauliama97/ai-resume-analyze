'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

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
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setPending(true);
    setError(null);

    try {
      const endpoint = admin
        ? `/api/admin/analyses/${analysisId}`
        : `/api/analyses/${analysisId}`;

      await toast.promise(
        (async () => {
          const response = await fetch(endpoint, { method: 'DELETE' });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as
              | { error?: { message?: string } }
              | null;
            throw new Error(
              payload?.error?.message ?? 'Analisis gagal dihapus. Coba lagi.',
            );
          }
        })(),
        {
          loading: 'Menghapus analisis...',
          success: 'Analisis dihapus.',
          error: (cause) =>
            cause instanceof Error ? cause.message : 'Analisis gagal dihapus. Coba lagi.',
        },
      );

      setOpen(false);
      router.push(admin ? '/admin/analyze-history' : '/history');
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Analisis gagal dihapus. Coba lagi.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="destructive"
            size={compact ? 'icon-sm' : 'sm'}
            aria-label={compact ? 'Hapus analisis' : undefined}
            title={compact ? 'Hapus analisis' : undefined}
          />
        }
      >
        {compact ? (
          <Trash2 aria-hidden="true" data-icon="inline-start" />
        ) : (
          <>
            <Trash2 aria-hidden="true" data-icon="inline-start" />
            Hapus analisis
          </>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus analisis ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Analisis, rekomendasi, feedback, dan berkas asli akan dihapus permanen.
            Tindakan ini tidak bisa dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onDelete}
            disabled={pending}
          >
            {pending ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

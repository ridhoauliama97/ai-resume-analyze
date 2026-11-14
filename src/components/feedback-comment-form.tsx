'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function FeedbackCommentForm({ analysisId }: { analysisId: string }) {
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmed = comment.trim();
    if (!trimmed) {
      setError('Tulis komentar terlebih dahulu.');
      return;
    }

    setPending(true);

    try {
      const response = await fetch(`/api/analyses/${analysisId}/feedback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ comment: trimmed }),
      });

      if (!response.ok) {
        setError('Komentar gagal disimpan. Coba lagi.');
        return;
      }

      setComment('');
      setMessage('Terima kasih, komentar Anda tersimpan.');
    } catch {
      setError('Komentar gagal disimpan. Coba lagi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label htmlFor="overall-comment" className="text-sm font-medium">
        Komentar keseluruhan (opsional)
      </label>
      <Textarea
        id="overall-comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={2_000}
        rows={4}
        placeholder="Ceritakan apakah analisis ini membantu atau apa yang bisa diperbaiki."
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div aria-live="polite">
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Kirim komentar'}
        </Button>
      </div>
    </form>
  );
}

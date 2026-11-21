'use client';

import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Recommendation } from '@/lib/db/queries';

const PRIORITY_LABELS: Record<Recommendation['priority'], string> = {
  high: 'Prioritas tinggi',
  medium: 'Prioritas sedang',
  low: 'Prioritas rendah',
};

const PRIORITY_CLASSES: Record<Recommendation['priority'], string> = {
  high: 'bg-red-600/10 text-red-700 dark:text-red-400',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  low: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
};

const LAYER_LABELS: Record<Recommendation['layer'], string> = {
  global: 'Global',
  job: 'Job-specific',
};

export function RecommendationCard({
  recommendation,
  initialRating,
  analysisId,
}: {
  recommendation: Recommendation;
  initialRating: -1 | 1 | null;
  analysisId: string;
}) {
  const [rating, setRating] = useState<-1 | 1 | null>(initialRating);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function vote(value: -1 | 1) {
    if (pending) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/analyses/${analysisId}/feedback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recommendationId: recommendation.id, rating: value }),
      });

      if (!response.ok) {
        setError('Vote gagal disimpan. Coba lagi.');
        return;
      }

      setRating(value);
    } catch {
      setError('Vote gagal disimpan. Coba lagi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Card size="sm">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{LAYER_LABELS[recommendation.layer]}</Badge>
          <Badge className={cn(PRIORITY_CLASSES[recommendation.priority])}>
            {PRIORITY_LABELS[recommendation.priority]}
          </Badge>
          <span className="text-xs text-muted-foreground">{recommendation.category}</span>
        </div>
        <CardTitle className="text-base">{recommendation.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed">{recommendation.detail}</p>
        {recommendation.evidence ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/80">Bukti:</span>{' '}
            {recommendation.evidence}
          </p>
        ) : null}
        {recommendation.example ? (
          <p className="rounded-md bg-muted px-3 py-2 text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/80">Contoh:</span>{' '}
            {recommendation.example}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-xs text-muted-foreground">Apakah saran ini berguna?</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Bermanfaat"
            aria-pressed={rating === 1}
            disabled={pending}
            onClick={() => vote(1)}
            className={cn(
              rating === 1 && 'border-emerald-600 bg-emerald-600/10 text-emerald-700',
            )}
          >
            <ThumbsUp aria-hidden="true" className="size-3.5" />
            <span className="sr-only">Bermanfaat</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Tidak bermanfaat"
            aria-pressed={rating === -1}
            disabled={pending}
            onClick={() => vote(-1)}
            className={cn(rating === -1 && 'border-red-600 bg-red-600/10 text-red-700')}
          >
            <ThumbsDown aria-hidden="true" className="size-3.5" />
            <span className="sr-only">Tidak bermanfaat</span>
          </Button>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

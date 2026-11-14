import { cn } from 'cn';
import type { Band } from '@/lib/types';

const BAND_ARC: Record<Band, string> = {
  red: 'text-red-600',
  yellow: 'text-amber-500',
  green: 'text-emerald-600',
};

const BAND_TRACK: Record<Band, string> = {
  red: 'text-red-600/20',
  yellow: 'text-amber-500/20',
  green: 'text-emerald-600/20',
};

const RADIUS = 64;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreGauge({
  score,
  band,
  label,
}: {
  score: number;
  band: Band;
  label: string;
}) {
  const clamped = Math.min(100, Math.max(0, score));
  const dash = (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-40 w-40">
        <svg
          role="img"
          aria-label={`Skor ${score} dari 100, ${label}`}
          data-band={band}
          viewBox="0 0 160 160"
          className="h-full w-full -rotate-90"
        >
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className={BAND_TRACK[band]}
          />
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
            className={cn('transition-[stroke-dasharray]', BAND_ARC[band])}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold tabular-nums">{score}</span>
          <span className="text-xs text-muted-foreground">dari 100</span>
        </div>
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

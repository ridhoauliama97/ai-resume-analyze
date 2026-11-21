import { cn } from 'cn';
import type { CategoryScore } from '@/lib/ai/schema';

const CATEGORY_NAMES: Record<string, string> = {
  G1: 'ATS Compatibility & Formatting',
  G2: 'Kontak & Ringkasan Profesional',
  G3: 'Pengalaman & Dampak',
  G4: 'Skill & Keyword',
  G5: 'Pendidikan & Sertifikasi',
  G6: 'Struktur, Kejelasan & Tata Bahasa',
  G7: 'Profesionalisme Keseluruhan',
  J1: 'Keyword & Skill Match',
  J2: 'Relevansi Pengalaman & Seniority',
  J3: 'Keselarasan Pencapaian',
  J4: 'Kesesuaian Pendidikan/Sertifikasi',
  J5: 'Gap & Risiko Must-have',
};

function barColor(score: number): string {
  if (score < 50) {
    return 'bg-red-500';
  }
  if (score < 70) {
    return 'bg-amber-500';
  }
  return 'bg-emerald-500';
}

export function CategoryBreakdown({
  categories,
  weights,
}: {
  categories: CategoryScore[];
  weights: Record<string, number>;
}) {
  return (
    <ul className="flex flex-col gap-5">
      {categories.map((category) => {
        const name = CATEGORY_NAMES[category.code] ?? category.code;
        const weight = weights[category.code];
        const score = Math.min(100, Math.max(0, category.score));

        return (
          <li key={category.code} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div>
                <span className="text-sm font-medium">{name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {category.code}
                  {weight !== undefined ? ` · bobot ${weight}%` : null}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums">{category.score}/100</span>
            </div>
            <div
              role="progressbar"
              aria-label={`${name}: ${category.score} dari 100`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={category.score}
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn('h-full rounded-full', barColor(score))}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{category.reason}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground/80">Bukti:</span> {category.evidence}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

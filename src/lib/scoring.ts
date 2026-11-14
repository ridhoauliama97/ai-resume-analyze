import type { Band } from './types';

export const GLOBAL_WEIGHTS: Record<string, number> = {
  G1: 15,
  G2: 10,
  G3: 25,
  G4: 15,
  G5: 10,
  G6: 15,
  G7: 10,
};

export const JOB_WEIGHTS: Record<string, number> = {
  J1: 30,
  J2: 30,
  J3: 20,
  J4: 10,
  J5: 10,
};

export function weightedScore(
  categories: { code: string; score: number }[],
  weights: Record<string, number>,
): number | null {
  let total = 0;

  for (const [code, weight] of Object.entries(weights)) {
    const category = categories.find((item) => item.code === code);

    if (!category || !Number.isFinite(category.score)) {
      return null;
    }

    total += Math.min(100, Math.max(0, category.score)) * weight;
  }

  return Math.round(total / 100);
}

export function bandForScore(score: number): Band {
  if (score < 50) {
    return 'red';
  }
  if (score < 70) {
    return 'yellow';
  }
  return 'green';
}

export function overallScore(globalScore: number, jobScore: number | null): number {
  if (jobScore === null) {
    return Math.round(globalScore);
  }

  return Math.round(globalScore * 0.6 + jobScore * 0.4);
}

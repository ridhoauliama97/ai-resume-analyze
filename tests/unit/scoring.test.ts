import { expect, test } from 'vitest';
import {
  GLOBAL_WEIGHTS,
  JOB_WEIGHTS,
  bandForScore,
  overallScore,
  weightedScore,
} from '@/lib/scoring';

function globalCategories(overrides: Record<string, number> = {}) {
  return Object.keys(GLOBAL_WEIGHTS).map((code) => ({
    code,
    score: overrides[code] ?? 100,
  }));
}

function jobCategories(overrides: Record<string, number> = {}) {
  return Object.keys(JOB_WEIGHTS).map((code) => ({
    code,
    score: overrides[code] ?? 100,
  }));
}

test('global weights total 100 and compute weighted score', () => {
  expect(Object.values(GLOBAL_WEIGHTS).reduce((sum, weight) => sum + weight, 0)).toBe(100);
  expect(weightedScore(globalCategories(), GLOBAL_WEIGHTS)).toBe(100);
  expect(weightedScore(globalCategories({ G1: 0 }), GLOBAL_WEIGHTS)).toBe(85);
  expect(weightedScore(globalCategories({ G3: 0 }), GLOBAL_WEIGHTS)).toBe(75);
});

test('job weights total 100 and compute independently', () => {
  expect(Object.values(JOB_WEIGHTS).reduce((sum, weight) => sum + weight, 0)).toBe(100);
  expect(weightedScore(jobCategories({ J1: 0 }), JOB_WEIGHTS)).toBe(70);
});

test('band boundaries', () => {
  expect(bandForScore(0)).toBe('red');
  expect(bandForScore(49)).toBe('red');
  expect(bandForScore(50)).toBe('yellow');
  expect(bandForScore(69)).toBe('yellow');
  expect(bandForScore(70)).toBe('green');
  expect(bandForScore(100)).toBe('green');
});

test('overall blends 60/40 only when job score exists', () => {
  expect(overallScore(70, 55)).toBe(64);
  expect(overallScore(70, null)).toBe(70);
});

test('missing required category returns null', () => {
  const withoutG7 = globalCategories().filter((category) => category.code !== 'G7');
  expect(weightedScore(withoutG7, GLOBAL_WEIGHTS)).toBeNull();
});

test('clamps scores into 0-100 and rejects non-finite scores', () => {
  expect(weightedScore(globalCategories({ G1: 120 }), GLOBAL_WEIGHTS)).toBe(100);
  expect(weightedScore(globalCategories({ G1: -20 }), GLOBAL_WEIGHTS)).toBe(85);
  expect(weightedScore(globalCategories({ G1: Number.NaN }), GLOBAL_WEIGHTS)).toBeNull();
});

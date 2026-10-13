import type { SetRow, Track } from './types';

/** Epley estimate of one-rep max. Only meaningful for 1–12 reps. */
export function e1rm(weight: number | null, reps: number | null): number | null {
  if (!weight || !reps || reps < 1) return null;
  if (reps === 1) return weight;
  const r = Math.min(reps, 12);
  return weight * (1 + r / 30);
}

export interface Prescription {
  weightKg: number | null;
  reps: number;
  durationS?: number;
  verdict: 'start' | 'add' | 'hold' | 'reps' | 'deload';
  reason: string;
  /** Change versus last time, kg. */
  deltaKg: number;
}

export interface Target {
  target_sets: number;
  rep_min: number;
  rep_max: number;
  increment_kg: number;
}

const roundTo = (v: number, step: number) => Math.round(v / step) * step;

/**
 * Double progression.
 * `history` = previous sessions' working sets for one exercise, newest session first.
 */
export function prescribe(
  history: SetRow[][],
  t: Target,
  track: Track,
  fmt: (kg: number) => string,
): Prescription {
  const working = history
    .map((s) => s.filter((x) => x.done && !x.is_warmup))
    .filter((s) => s.length > 0);
  const last = working[0];

  if (track === 'time') {
    const best = last ? Math.max(...last.map((s) => s.duration_s ?? 0)) : 0;
    if (!best) return { weightKg: null, reps: 0, durationS: 30, verdict: 'start', reason: 'Start with a hold you can keep with clean form.', deltaKg: 0 };
    return { weightKg: null, reps: 0, durationS: best + 5, verdict: 'reps', reason: `Last time you held ${best}s. Add 5 seconds.`, deltaKg: 0 };
  }

  if (!last) {
    return {
      weightKg: null,
      reps: t.rep_min,
      verdict: 'start',
      reason: track === 'bodyweight'
        ? `First time. Do ${t.rep_min}–${t.rep_max} clean reps per set.`
        : `First time. Find a weight you can move for ${t.rep_min} clean reps, leaving 1–2 in the tank.`,
      deltaKg: 0,
    };
  }

  if (track === 'bodyweight' || track === 'cardio') {
    const minReps = Math.min(...last.map((s) => s.reps ?? 0));
    const allTop = last.length >= t.target_sets && last.every((s) => (s.reps ?? 0) >= t.rep_max);
    if (allTop) {
      return { weightKg: null, reps: t.rep_max + 1, verdict: 'add', reason: `You cleared ${t.rep_max} on every set. Push past the range — or add load with a belt or vest.`, deltaKg: 0 };
    }
    return { weightKg: null, reps: Math.min(t.rep_max, minReps + 1), verdict: 'reps', reason: `Beat your weakest set from last time (${minReps}). One more rep each set.`, deltaKg: 0 };
  }

  const top = Math.max(...last.map((s) => Number(s.weight_kg ?? 0)));
  const atTop = last.filter((s) => Number(s.weight_kg ?? 0) === top);
  const topReps = atTop.map((s) => s.reps ?? 0);
  const inc = t.increment_kg > 0 ? t.increment_kg : 2.5;

  // Every prescribed set at the top of the rep range → add load.
  if (atTop.length >= t.target_sets && topReps.every((r) => r >= t.rep_max)) {
    const next = roundTo(top + inc, 0.25);
    return {
      weightKg: next,
      reps: t.rep_min,
      verdict: 'add',
      reason: `${fmt(top)} for ${t.rep_max}+ on all ${atTop.length} sets. The bar goes up.`,
      deltaKg: next - top,
    };
  }

  const missed = topReps.some((r) => r < t.rep_min);
  if (missed) {
    const prev = working[1];
    const prevTop = prev ? Math.max(...prev.map((s) => Number(s.weight_kg ?? 0))) : null;
    const prevMissed = prev && prevTop === top && prev.filter((s) => Number(s.weight_kg ?? 0) === top).some((s) => (s.reps ?? 0) < t.rep_min);
    if (prevMissed) {
      const next = roundTo(top * 0.9, inc >= 2.5 ? 2.5 : 1);
      return {
        weightKg: next,
        reps: t.rep_min,
        verdict: 'deload',
        reason: `Two sessions short of ${t.rep_min} reps at ${fmt(top)}. Drop 10% and build back with clean reps.`,
        deltaKg: next - top,
      };
    }
    return {
      weightKg: top,
      reps: t.rep_min,
      verdict: 'hold',
      reason: `You fell short of ${t.rep_min} reps last time. Same weight — own every rep.`,
      deltaKg: 0,
    };
  }

  const weakest = Math.min(...topReps);
  const target = Math.min(t.rep_max, weakest + 1);
  return {
    weightKg: top,
    reps: target,
    verdict: 'reps',
    reason: `Same weight. Your weakest set was ${weakest} — aim for ${target} on every set.`,
    deltaKg: 0,
  };
}

/** Plates per side for a barbell load, greedy. */
export function platesPerSide(totalKg: number, barKg: number, unit: 'kg' | 'lb'): { plates: number[]; remainder: number } {
  const LB = 2.2046226218;
  const total = unit === 'lb' ? totalKg * LB : totalKg;
  const bar = unit === 'lb' ? Math.round(barKg * LB) : barKg;
  const sizes = unit === 'lb' ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25];
  let side = (total - bar) / 2;
  const plates: number[] = [];
  if (side <= 0) return { plates, remainder: 0 };
  for (const p of sizes) {
    while (side >= p - 1e-6) {
      plates.push(p);
      side -= p;
    }
  }
  return { plates, remainder: Math.round(side * 100) / 100 };
}

export function isBarbell(equipment: string | null): boolean {
  return equipment === 'barbell';
}

import type { Unit } from './types';

const LB = 2.2046226218;

/** kg → display unit, rounded for humans. */
export function toDisplay(kg: number | null | undefined, unit: Unit): number | null {
  if (kg == null || Number.isNaN(kg)) return null;
  const v = unit === 'lb' ? kg * LB : kg;
  return Math.round(v * 4) / 4;
}

/** display unit → kg for storage. */
export function fromDisplay(v: number | null | undefined, unit: Unit): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return unit === 'lb' ? v / LB : v;
}

export function fmtNum(n: number | null | undefined, max = 2): string {
  if (n == null || Number.isNaN(n)) return '—';
  return Number(n.toFixed(max)).toLocaleString('en-IN', { maximumFractionDigits: max });
}

export function fmtWeight(kg: number | null | undefined, unit: Unit): string {
  const v = toDisplay(kg, unit);
  return v == null ? '—' : fmtNum(v, 2);
}

export function fmtVolume(kg: number, unit: Unit): string {
  const v = toDisplay(kg, unit) ?? 0;
  if (v >= 10000) return `${fmtNum(v / 1000, 1)}k`;
  return fmtNum(Math.round(v), 0);
}

export function fmtDuration(s: number | null | undefined): string {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
}

/** Default loading increment in kg for a unit. */
export function defaultIncrementKg(unit: Unit, equipment: string | null): number {
  const small = equipment === 'dumbbell' || equipment === 'cable' || equipment === 'machine' || equipment === 'kettlebells';
  if (unit === 'lb') return (small ? 5 : 5) / LB;
  return small ? 2 : 2.5;
}

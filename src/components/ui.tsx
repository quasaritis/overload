import { useEffect, useState, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { IMAGE_BASE } from '../lib/supabase';
import type { ExerciseLite } from '../lib/types';
import { platesPerSide } from '../lib/progression';

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden /> {label}…
    </div>
  );
}

export function ErrorLine({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="error" role="alert">
      <AlertCircle aria-hidden /> <span>{children}</span>
    </p>
  );
}

export function Lights({ count, on, red = 0 }: { count: number; on: number; red?: number }) {
  return (
    <span className="lights" aria-label={`${on} of ${count} sets done`}>
      {Array.from({ length: count }, (_, i) => (
        <i key={i} className={i < on ? 'on' : i < on + red ? 'red' : ''} />
      ))}
    </span>
  );
}

export function Thumb({ ex, size = 56 }: { ex: Pick<ExerciseLite, 'images' | 'name'>; size?: number }) {
  const [broken, setBroken] = useState(false);
  const src = ex.images?.[0];
  if (!src || broken) {
    const initials = ex.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
    return (
      <span className="thumb ph" style={{ width: size, height: size }} aria-hidden>
        {initials}
      </span>
    );
  }
  return (
    <img
      className="thumb"
      src={IMAGE_BASE + src}
      alt=""
      loading="lazy"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      onError={() => setBroken(true)}
    />
  );
}

const PLATE_COLOR: Record<string, string> = {
  '25': 'var(--plate-25)', '20': 'var(--plate-20)', '15': 'var(--plate-15)', '10': 'var(--plate-10)', '5': 'var(--plate-5)', '2.5': 'var(--plate-2)', '1.25': 'var(--plate-1)',
  '45': 'var(--plate-20)', '35': 'var(--plate-15)',
};
const PLATE_H: Record<string, number> = { '25': 76, '20': 76, '15': 66, '10': 54, '5': 40, '2.5': 32, '1.25': 26, '45': 76, '35': 66 };
const PLATE_W: Record<string, number> = { '25': 14, '20': 12, '15': 11, '10': 10, '5': 8, '2.5': 7, '1.25': 6, '45': 14, '35': 12 };

/** One side of a loaded barbell, IPF plate colours. */
export function Barbell({ totalKg, barKg, unit }: { totalKg: number; barKg: number; unit: 'kg' | 'lb' }) {
  const { plates, remainder } = platesPerSide(totalKg, barKg, unit);
  const counts = new Map<number, number>();
  plates.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1));
  const barShown = unit === 'lb' ? Math.round(barKg * 2.2046) : barKg;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="bar" role="img" aria-label={`Per side: ${plates.join(', ') || 'empty bar'} ${unit}`}>
        <span className="shaft" style={{ maxWidth: 90 }} />
        <span className="stop" />
        {plates.map((p, i) => (
          <span
            key={i}
            className="plate"
            style={{ height: PLATE_H[String(p)] ?? 30, width: PLATE_W[String(p)] ?? 8, background: PLATE_COLOR[String(p)] ?? 'var(--plate-1)' }}
          />
        ))}
        <span className="collar" />
        <span className="sleeve" style={{ width: Math.max(18, 70 - plates.length * 8) }} />
      </div>
      <p className="plate-legend">
        {plates.length === 0 ? (
          <span>Empty bar ({barShown} {unit})</span>
        ) : (
          <>
            <span>Each side:</span>
            {[...counts.entries()].map(([p, n]) => (
              <span key={p}>
                <b>{n > 1 ? `${n}×` : ''}{p}</b>
              </span>
            ))}
            <span className="faint">· {barShown} {unit} bar</span>
          </>
        )}
        {remainder > 0 && <span className="faint">+{remainder} {unit} you can’t load with standard plates</span>}
      </p>
    </div>
  );
}

export function useDebounced<T>(v: T, ms = 200) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export function relDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-IN', { weekday: 'long' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

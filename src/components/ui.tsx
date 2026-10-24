import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IMAGE_BASE } from '../lib/supabase';
import type { ExerciseLite } from '../lib/types';
import { platesPerSide, type Prescription } from '../lib/progression';

/** लेबर चौक — the wordmark, hand-painted Devanagari over a small Latin line. */
export function Brandmark({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`brandmark ${className}`.trim()} aria-label="Labour Chowk, home">
      <span className="dev" lang="hi" aria-hidden>लेबर चौक</span>
      <span className="lat" aria-hidden>Labour Chowk</span>
    </Link>
  );
}

/** Sentence-case a data label ("chest" → "Chest", "body only" → "Body only"). */
export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

type Back = { label: string; to?: string; onClick?: () => void };

/**
 * The header every screen uses: an optional back link, the title, one line of context, and actions on the right.
 * `title` may be replaced by `titleSlot` when the title carries its own controls (the food day switcher).
 */
export function PageHead({ title, titleSlot, sub, back, actions }: { title?: ReactNode; titleSlot?: ReactNode; sub?: ReactNode; back?: Back; actions?: ReactNode }) {
  return (
    <header className="page-head">
      {back && (back.to ? (
        <Link to={back.to} className="btn ghost sm back"><ChevronLeft aria-hidden /> {back.label}</Link>
      ) : (
        <button type="button" className="btn ghost sm back" onClick={back.onClick}><ChevronLeft aria-hidden /> {back.label}</button>
      ))}
      <div className="page-head-row">
        <div>
          {titleSlot ?? <h1 className="t-title">{title}</h1>}
          {sub && <p className="sub">{sub}</p>}
        </div>
        {actions && <div className="page-head-actions">{actions}</div>}
      </div>
    </header>
  );
}

/** A section's heading, an optional line under it, and at most one action on the right. Every section uses it. */
export function SectionHead({ id, title, sub, action }: { id?: string; title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <h2 id={id} className="t-head">{title}</h2>
        {sub && <p className="faint t-small">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Segmented control. The selected option sits on a thumb that slides between options,
 * so a change reads as one thing moving rather than two buttons swapping colour.
 */
export function Seg<T extends string | number | null>({ options, value, onChange, label, block, className = '', tabs }: {
  options: readonly (readonly [T, ReactNode])[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  block?: boolean;
  className?: string;
  tabs?: boolean;
}) {
  const i = options.findIndex(([v]) => v === value);
  return (
    <div
      className={`seg${block ? ' block' : ''}${className ? ` ${className}` : ''}`}
      role={tabs ? 'tablist' : 'group'}
      aria-label={label}
      style={{ '--i': Math.max(0, i), '--n': options.length } as CSSProperties}
    >
      {i >= 0 && <span className="seg-thumb" aria-hidden />}
      {options.map(([v, l]) => (
        <button
          key={String(v)}
          type="button"
          {...(tabs ? { role: 'tab', 'aria-selected': v === value } : { 'aria-pressed': v === value })}
          onClick={() => onChange(v)}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/**
 * Press and hold to confirm something you can't undo. The button fills with sindoor while held;
 * letting go early snaps it back. Works with Enter or Space held down too.
 */
export function HoldButton({ onConfirm, children, ms = 1000, className = 'btn danger', disabled, hint = 'Press and hold to confirm' }: {
  onConfirm: () => void;
  children: ReactNode;
  ms?: number;
  className?: string;
  disabled?: boolean;
  hint?: string;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const done = useRef(onConfirm);
  done.current = onConfirm;
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const start = () => {
    if (disabled || timer.current) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      setHolding(false);
      if (navigator.vibrate) navigator.vibrate(20);
      done.current();
    }, ms);
  };
  const stop = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    setHolding(false);
  };
  const isKey = (k: string) => k === 'Enter' || k === ' ';

  return (
    <button
      type="button"
      className={`${className} hold${holding ? ' holding' : ''}`}
      style={{ '--hold': `${ms}ms` } as CSSProperties}
      disabled={disabled}
      title={hint}
      onPointerDown={(e) => { if (e.button === 0) start(); }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => { if (isKey(e.key)) { e.preventDefault(); if (!e.repeat) start(); } }}
      onKeyUp={(e) => { if (isKey(e.key)) stop(); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="hold-fill" aria-hidden />
      {children}
    </button>
  );
}

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

/**
 * Chalk tally of sets: one stroke per set, every fifth crosses the gate.
 * `on` strokes are chalked, `red` strokes are misses, the rest are faint guide marks.
 */
export function Lights({ count, on, red = 0, size, seq }: { count: number; on: number; red?: number; size?: 'lg'; seq?: boolean }) {
  const groups: number[][] = [];
  for (let i = 0; i < count; i++) {
    if (i % 5 === 0) groups.push([]);
    groups[groups.length - 1].push(i);
  }
  const cls = (i: number) => (i < on ? 'on' : i < on + red ? 'red' : '');
  const X = [5, 11, 17, 23];
  // seq: strokes chalk on one after another (the end-of-workout tally), otherwise each draws as it's earned.
  const delay = (i: number) => (seq ? ({ animationDelay: `${260 + i * 110}ms` } as CSSProperties) : undefined);
  return (
    <span className={`tally${size ? ` ${size}` : ''}${seq ? ' seq' : ''}`} role="img" aria-label={`${on} of ${count} sets done`}>
      {groups.map((g, gi) => (
        <svg key={gi} viewBox="0 0 28 22" aria-hidden>
          {g.map((i, k) =>
            k < 4 ? (
              <line key={i} className={cls(i)} style={delay(i)} x1={X[k]} y1={3 + (k % 2)} x2={X[k] + (k % 2 ? 0.6 : -0.4)} y2={19} />
            ) : (
              <line key={i} className={cls(i)} style={delay(i)} x1={1.5} y1={16} x2={26.5} y2={6} />
            ),
          )}
        </svg>
      ))}
    </span>
  );
}

export function Thumb({ ex, size = 56 }: { ex: Pick<ExerciseLite, 'images' | 'name'>; size?: number }) {
  const [broken, setBroken] = useState(false);
  const src = ex.images?.[0];
  if (!src || broken) {
    const initials = ex.name.replace(/\(.*?\)/g, ' ').split(/[^A-Za-z]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
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

/** The coach's call for the next attempt, in the same words on every screen. */
export function verdictText(rx: Pick<Prescription, 'verdict' | 'deltaKg'>, w: (kg: number) => string, unit: string): string {
  switch (rx.verdict) {
    case 'add': return rx.deltaKg > 0 ? `+${w(rx.deltaKg)} ${unit}` : 'Add a rep';
    case 'deload': return `−${w(Math.abs(rx.deltaKg))} ${unit}`;
    case 'hold': return 'Same weight';
    case 'reps': return 'One more rep';
    default: return 'First session';
  }
}

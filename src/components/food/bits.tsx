import type { Nutr } from '../../lib/food';

const DIET_LABEL = { v: 'Vegetarian', e: 'Contains egg', n: 'Non-vegetarian' } as const;

/** The Indian veg / non-veg mark: a square with a dot (green veg, red-brown non-veg, yellow egg). */
export function DietMark({ diet }: { diet: 'v' | 'e' | 'n' }) {
  return <span className={`diet ${diet}`} role="img" aria-label={DIET_LABEL[diet]} title={DIET_LABEL[diet]} />;
}

export const kcalFmt = (n: number) => Math.round(n).toLocaleString('en-IN');
export const gFmt = (n: number) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10).toLocaleString('en-IN');

export function Macros({ n, short }: { n: Nutr; short?: boolean }) {
  if (short) return <span className="macro-line">P {gFmt(n.p)} · C {gFmt(n.c)} · F {gFmt(n.f)}</span>;
  return (
    <span className="macro-line">
      <b>{gFmt(n.p)} g</b> protein · {gFmt(n.c)} g carbs · {gFmt(n.f)} g fat
    </span>
  );
}

/** Compact readout of what's about to be logged. */
export function Readout({ n, label = 'You’re adding' }: { n: Nutr; label?: string }) {
  return (
    <div className="readout" aria-live="polite">
      <div>
        <p className="t-label">{label}</p>
        <p className="readout-k num">
          {kcalFmt(n.kcal)}
          <span>kcal</span>
        </p>
      </div>
      <dl className="readout-m">
        <div><dt>Protein</dt><dd className="num">{gFmt(n.p)}<small>g</small></dd></div>
        <div><dt>Carbs</dt><dd className="num">{gFmt(n.c)}<small>g</small></dd></div>
        <div><dt>Fat</dt><dd className="num">{gFmt(n.f)}<small>g</small></dd></div>
      </dl>
    </div>
  );
}

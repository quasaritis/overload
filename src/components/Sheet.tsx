import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Bottom sheet on phones, centred panel on desktop. Escape and backdrop close it. */
export function Sheet({ title, onClose, children, head, label }: { title: ReactNode; onClose: () => void; children: ReactNode; head?: ReactNode; label?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // The page behind the sheet can't be tabbed to or read out while it's open.
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      root?.removeAttribute('inert');
    };
  }, [onClose]);

  return createPortal(
    <>
      <div className="panel-backdrop" onClick={onClose} />
      <div className="panel" role="dialog" aria-modal="true" aria-label={label ?? (typeof title === 'string' ? title : undefined)}>
        <div className="panel-head">
          <div className="row between">
            <h2 className="t-head">{title}</h2>
            <button className="btn icon ghost" onClick={onClose} aria-label="Close">
              <X />
            </button>
          </div>
          {head}
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </>,
    document.body,
  );
}

/** − value + stepper for servings. */
export function Stepper({ value, onChange, step = 0.5, min = 0.25, max = 50, label, format }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; label: string; format?: (v: number) => string }) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <div className="stepper" role="group" aria-label={label}>
      {/* quarter steps below one serving (½ roti, ¼ plate), `step` above */}
      <button type="button" onClick={() => set(value - (value <= 1 ? Math.min(step, 0.25) : step))} disabled={value <= min} aria-label={`Less ${label}`}>−</button>
      <output className="num" aria-live="polite">{format ? format(value) : value}</output>
      <button type="button" onClick={() => set(value + (value < 1 ? Math.min(step, 0.25) : step))} disabled={value >= max} aria-label={`More ${label}`}>+</button>
    </div>
  );
}

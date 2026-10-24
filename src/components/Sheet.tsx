import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface SheetHandle {
  /** Slide the sheet away, then call onClose. Use this instead of onClose so the exit animates. */
  close: () => void;
}

const PHONE = '(max-width: 899px)';
const REDUCE = '(prefers-reduced-motion: reduce)';

/**
 * Bottom sheet on phones, centred panel on desktop.
 * Escape, the backdrop, the close button and (on phones) a downward drag or flick on the title row close it.
 * It leaves the way it came: down off the screen on phones, a quick fade on desktop.
 */
export const Sheet = forwardRef<SheetHandle, { title: ReactNode; onClose: () => void; children: ReactNode; head?: ReactNode; label?: string }>(
  function Sheet({ title, onClose, children, head, label }, ref) {
    const panel = useRef<HTMLDivElement>(null);
    const backdrop = useRef<HTMLDivElement>(null);
    const closing = useRef(false);
    const done = useRef(onClose);
    done.current = onClose;
    const drag = useRef<{ id: number; y0: number; t0: number; dy: number } | null>(null);

    const close = useCallback(() => {
      if (closing.current) return;
      closing.current = true;
      const p = panel.current;
      if (!p || window.matchMedia(REDUCE).matches) return done.current();
      const phone = window.matchMedia(PHONE).matches;
      const ms = phone ? 240 : 150;
      // Start from wherever the sheet is right now (mid-entrance or mid-drag), so the exit never jumps.
      const now = getComputedStyle(p).transform;
      p.style.animation = 'none';
      p.style.transform = now === 'none' ? '' : now;
      void p.getBoundingClientRect();
      p.style.transition = `transform ${ms}ms var(--ease-out), opacity ${ms}ms var(--ease-out)`;
      p.style.transform = phone ? 'translateY(100%)' : 'scale(0.97)';
      if (!phone) p.style.opacity = '0';
      const b = backdrop.current;
      if (b) {
        b.style.transition = `opacity ${ms}ms var(--ease-out)`;
        b.style.opacity = '0';
      }
      window.setTimeout(() => done.current(), ms);
    }, []);

    useImperativeHandle(ref, () => ({ close }), [close]);

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
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
    }, [close]);

    // Drag the title row down to dismiss. A quick flick is enough; no need to drag past a line.
    function onDown(e: React.PointerEvent) {
      const p = panel.current;
      if (!p || drag.current || closing.current || !window.matchMedia(PHONE).matches) return;
      if ((e.target as HTMLElement).closest('button, a, input, select, textarea, label')) return;
      drag.current = { id: e.pointerId, y0: e.clientY, t0: performance.now(), dy: 0 };
      e.currentTarget.setPointerCapture(e.pointerId);
      p.style.animation = 'none';
      p.style.transition = 'none';
    }
    function onMove(e: React.PointerEvent) {
      const d = drag.current;
      const p = panel.current;
      if (!d || !p || e.pointerId !== d.id) return;
      const raw = e.clientY - d.y0;
      // Upward drags meet friction instead of a wall.
      d.dy = raw >= 0 ? raw : -Math.min(28, Math.sqrt(-raw) * 2.4);
      p.style.transform = `translateY(${d.dy}px)`;
    }
    function onUp(e: React.PointerEvent) {
      const d = drag.current;
      const p = panel.current;
      if (!d || !p || e.pointerId !== d.id) return;
      drag.current = null;
      const velocity = d.dy / Math.max(1, performance.now() - d.t0);
      if (d.dy > 120 || (d.dy > 12 && velocity > 0.11)) return close();
      p.style.transition = 'transform 420ms var(--ease-drawer)';
      p.style.transform = 'translateY(0)';
    }

    return createPortal(
      <>
        <div className="panel-backdrop" ref={backdrop} onClick={close} />
        <div className="panel" ref={panel} role="dialog" aria-modal="true" aria-label={label ?? (typeof title === 'string' ? title : undefined)}>
          <div className="panel-head">
            <div className="row between panel-grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
              <h2 className="t-head">{title}</h2>
              <button className="btn icon ghost" onClick={close} aria-label="Close">
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
  },
);

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

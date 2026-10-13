import { useMemo, useRef, useState } from 'react';

export interface Pt { t: number; y: number; note?: string }

/** Lightweight SVG line chart with a tap/hover readout. */
export function LineChart({
  points,
  fmt,
  height = 220,
  color = 'var(--data-soft)',
  highlightMax = true,
}: {
  points: Pt[];
  fmt: (v: number) => string;
  height?: number;
  color?: string;
  highlightMax?: boolean;
}) {
  const W = 640;
  const H = height;
  const pad = { l: 44, r: 16, t: 16, b: 28 };
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    if (!points.length) return null;
    const ts = points.map((p) => p.t);
    const ys = points.map((p) => p.y);
    const t0 = Math.min(...ts);
    const t1 = Math.max(...ts);
    let y0 = Math.min(...ys);
    let y1 = Math.max(...ys);
    const span = y1 - y0 || Math.max(1, y1 * 0.1);
    y0 = Math.max(0, y0 - span * 0.15);
    y1 = y1 + span * 0.15;
    const x = (t: number) => pad.l + (t1 === t0 ? (W - pad.l - pad.r) / 2 : ((t - t0) / (t1 - t0)) * (W - pad.l - pad.r));
    const y = (v: number) => pad.t + (1 - (v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
    const ticks = [0, 0.5, 1].map((f) => y0 + f * (y1 - y0));
    const maxI = ys.indexOf(Math.max(...ys));
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
    const dates = [t0, t1].filter((v, i, a) => a.indexOf(v) === i);
    return { x, y, ticks, maxI, d, dates };
  }, [points, H]);

  if (!geo) return null;

  const onMove = (e: React.PointerEvent) => {
    const svg = ref.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    let bd = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(geo.x(p.t) - px);
      if (d < bd) { bd = d; best = i; }
    });
    setHover(best);
  };

  const hp = hover != null ? points[hover] : null;
  const dateFmt = (t: number) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="chart-wrap">
      <svg
        ref={ref}
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Chart of ${points.length} points, latest ${fmt(points[points.length - 1].y)}`}
      >
        {geo.ticks.map((v, i) => (
          <g key={i}>
            <line className="grid" x1={pad.l} x2={W - pad.r} y1={geo.y(v)} y2={geo.y(v)} />
            <text x={pad.l - 8} y={geo.y(v) + 4} textAnchor="end">{fmt(v)}</text>
          </g>
        ))}
        {geo.dates.map((t, i) => (
          <text key={t} x={geo.x(t)} y={H - 6} textAnchor={geo.dates.length === 1 ? 'middle' : i === 0 ? 'start' : 'end'}>{dateFmt(t)}</text>
        ))}
        <path d={geo.d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={geo.x(p.t)} cy={geo.y(p.y)} r={hover === i ? 6 : points.length > 40 ? 0 : 3.5} fill={color} />
        ))}
        {highlightMax && (
          <circle cx={geo.x(points[geo.maxI].t)} cy={geo.y(points[geo.maxI].y)} r={7} fill="none" stroke="var(--plate-15)" strokeWidth={2} />
        )}
        {hp && <line x1={geo.x(hp.t)} x2={geo.x(hp.t)} y1={pad.t} y2={H - pad.b} stroke="var(--rule-strong)" strokeDasharray="3 3" />}
      </svg>
      {hp && (
        <div className="chart-tip" style={{ left: `${(geo.x(hp.t) / W) * 100}%`, top: `${(geo.y(hp.y) / H) * 100}%` }}>
          {fmt(hp.y)} · {dateFmt(hp.t)}
          {hp.note ? ` · ${hp.note}` : ''}
        </div>
      )}
    </div>
  );
}

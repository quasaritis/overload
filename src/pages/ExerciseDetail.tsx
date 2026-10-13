import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { getExercise, allSetsFor } from '../lib/data';
import { e1rm } from '../lib/progression';
import { IMAGE_BASE, humanError } from '../lib/supabase';
import type { Exercise, SetRow } from '../lib/types';
import { ErrorLine, Loading, relDate } from '../components/ui';
import { LineChart } from '../components/LineChart';
import { useApp } from '../lib/app';
import { fmtVolume } from '../lib/units';

type Row = SetRow & { sessions: { started_at: string } };

export default function ExerciseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { w, unit } = useApp();
  const [ex, setEx] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!id) return;
    Promise.all([getExercise(id), allSetsFor(id)])
      .then(([e, s]) => { setEx(e); setSets(s); })
      .catch((x) => setErr(humanError(x)));
  }, [id]);

  // Alternate the two reference photos like a flip book.
  useEffect(() => {
    if (!ex || ex.images.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % ex.images.length), 1100);
    return () => clearInterval(t);
  }, [ex]);

  const stats = useMemo(() => {
    const work = sets.filter((s) => !s.is_warmup);
    const bySession = new Map<string, Row[]>();
    work.forEach((s) => {
      if (!bySession.has(s.session_id)) bySession.set(s.session_id, []);
      bySession.get(s.session_id)!.push(s);
    });
    const sessions = [...bySession.values()].map((rows) => {
      const best = rows.reduce((a, b) => ((e1rm(Number(b.weight_kg), b.reps) ?? 0) > (e1rm(Number(a.weight_kg), a.reps) ?? 0) ? b : a));
      return {
        t: new Date(rows[0].sessions.started_at).getTime(),
        date: rows[0].sessions.started_at,
        sessionId: rows[0].session_id,
        e1: e1rm(Number(best.weight_kg), best.reps) ?? 0,
        best,
        rows,
        topReps: Math.max(...rows.map((r) => r.reps ?? 0)),
        topHold: Math.max(...rows.map((r) => r.duration_s ?? 0)),
        volume: rows.reduce((a, r) => a + Number(r.weight_kg ?? 0) * (r.reps ?? 0), 0),
      };
    }).sort((a, b) => a.t - b.t);
    const heaviest = work.reduce<Row | null>((a, b) => (!a || Number(b.weight_kg ?? 0) > Number(a.weight_kg ?? 0) ? b : a), null);
    const repMaxes = new Map<number, number>();
    work.forEach((s) => {
      if (!s.reps || s.reps > 12 || s.weight_kg == null) return;
      repMaxes.set(s.reps, Math.max(repMaxes.get(s.reps) ?? 0, Number(s.weight_kg)));
    });
    return { sessions, heaviest, repMaxes };
  }, [sets]);

  if (!ex) return err ? <ErrorLine>{err}</ErrorLine> : <Loading />;

  const track = ex.track;
  const best = stats.sessions.length ? Math.max(...stats.sessions.map((s) => s.e1)) : 0;

  return (
    <div>
      <button className="btn ghost sm" style={{ marginLeft: -8, marginBottom: 12 }} onClick={() => (window.history.length > 1 ? nav(-1) : nav('/exercises'))}>
        <ChevronLeft /> Back
      </button>
      <header className="page-head" style={{ marginBottom: 'var(--s-5)' }}>
        <div>
          <h1 className="t-title">{ex.name}</h1>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {ex.primary_muscles.map((m) => <Link key={m} to={`/exercises?muscle=${encodeURIComponent(m)}`} className="tag" style={{ textDecoration: 'none', background: 'var(--chalk)', color: 'var(--stage)' }}>{m}</Link>)}
            {ex.secondary_muscles.map((m) => <span key={m} className="tag">{m}</span>)}
            {ex.equipment && <span className="tag">{ex.equipment}</span>}
            {ex.level && <span className="tag">{ex.level}</span>}
            {ex.mechanic && <span className="tag">{ex.mechanic}</span>}
          </div>
        </div>
      </header>

      {stats.sessions.length > 0 ? (
        <section aria-labelledby="your-h">
          <h2 id="your-h" className="t-head" style={{ marginBottom: 'var(--s-4)' }}>Your record</h2>
          <div className="facts">
            {track === 'weight_reps' && (
              <>
                <div className="fact"><span className="v num">{w(best)}</span><span className="k">best est. 1RM ({unit})</span></div>
                <div className="fact"><span className="v num">{stats.heaviest ? `${w(Number(stats.heaviest.weight_kg))}×${stats.heaviest.reps}` : '—'}</span><span className="k">heaviest set</span></div>
              </>
            )}
            {track === 'time' && <div className="fact"><span className="v num">{Math.max(...stats.sessions.map((s) => s.topHold))}s</span><span className="k">longest hold</span></div>}
            {(track === 'bodyweight' || track === 'cardio') && <div className="fact"><span className="v num">{Math.max(...stats.sessions.map((s) => s.topReps))}</span><span className="k">most reps</span></div>}
            <div className="fact"><span className="v num">{stats.sessions.length}</span><span className="k">sessions</span></div>
          </div>

          {track === 'weight_reps' && stats.sessions.length > 1 && (
            <div style={{ marginTop: 'var(--s-5)' }}>
              <p className="t-label" style={{ marginBottom: 8 }}>Estimated 1RM per session</p>
              <LineChart points={stats.sessions.map((s) => ({ t: s.t, y: s.e1, note: `${w(Number(s.best.weight_kg))}×${s.best.reps}` }))} fmt={(v) => w(v)} />
            </div>
          )}

          {track === 'weight_reps' && stats.repMaxes.size > 0 && (
            <div style={{ marginTop: 'var(--s-5)' }}>
              <p className="t-label" style={{ marginBottom: 8 }}>Best weight at each rep count</p>
              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {[...stats.repMaxes.entries()].sort((a, b) => a[0] - b[0]).map(([r, kg]) => (
                  <span key={r} className="board" style={{ padding: '10px 14px', display: 'grid', gap: 2, minWidth: 84 }}>
                    <span className="faint t-small">{r} rep{r > 1 ? 's' : ''}</span>
                    <span className="num" style={{ fontSize: '1.375rem', fontWeight: 600 }}>{w(kg)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 'var(--s-5)' }}>
            <p className="t-label" style={{ marginBottom: 8 }}>Recent sessions</p>
            <div className="list">
              {[...stats.sessions].reverse().slice(0, 8).map((s) => (
                <Link key={s.sessionId} to={`/history/${s.sessionId}`} className="list-item" style={{ minHeight: 56 }}>
                  <span className="grow">
                    <span className="title num" style={{ display: 'block', fontSize: '1.125rem' }}>
                      {s.rows.map((r) => (track === 'time' ? `${r.duration_s}s` : track === 'weight_reps' ? `${w(Number(r.weight_kg))}×${r.reps}` : `${r.reps}`)).join('  ·  ')}
                    </span>
                    <span className="meta" style={{ textTransform: 'none' }}>{relDate(s.date)}{track === 'weight_reps' ? ` · ${fmtVolume(s.volume, unit)} ${unit}` : ''}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <p className="notice muted">You haven’t logged this yet. Add it to a plan or a workout and your numbers will build up here.</p>
      )}

      <section className="section" aria-labelledby="how-h">
        <h2 id="how-h" className="t-head" style={{ marginBottom: 'var(--s-4)' }}>How to do it</h2>
        <div style={{ display: 'grid', gap: 'var(--s-5)', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', alignItems: 'start' }}>
          {ex.images.length > 0 && (
            <figure style={{ margin: 0 }}>
              <div style={{ position: 'relative', aspectRatio: '4 / 3', borderRadius: 12, overflow: 'hidden', background: 'var(--stage-2)' }}>
                {ex.images.map((src, i) => (
                  <img
                    key={src}
                    src={IMAGE_BASE + src}
                    alt={i === 0 ? `${ex.name}, start position` : `${ex.name}, end position`}
                    loading="lazy"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === frame ? 1 : 0, transition: 'opacity 250ms' }}
                  />
                ))}
              </div>
              <figcaption className="faint t-small" style={{ marginTop: 6 }}>Photos: free-exercise-db (public domain)</figcaption>
            </figure>
          )}
          {ex.instructions.length > 0 ? (
            <ol style={{ margin: 0, paddingLeft: '1.25em', display: 'grid', gap: 10, maxWidth: '65ch' }}>
              {ex.instructions.map((s, i) => <li key={i} className="muted">{s}</li>)}
            </ol>
          ) : (
            <p className="muted">No written cues for this one yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

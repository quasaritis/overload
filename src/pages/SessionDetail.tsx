import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { getSession, getExercises } from '../lib/data';
import { supabase, humanError } from '../lib/supabase';
import type { ExerciseLite, Session, SetRow } from '../lib/types';
import { ErrorLine, Loading } from '../components/ui';
import { useApp } from '../lib/app';
import { e1rm } from '../lib/progression';
import { fmtVolume } from '../lib/units';

export default function SessionDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { w, unit, toast } = useApp();
  const [data, setData] = useState<{ session: Session; sets: SetRow[] } | null>(null);
  const [exMap, setExMap] = useState<Map<string, ExerciseLite>>(new Map());
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getSession(id), getExercises()])
      .then(([d, exs]) => { setData(d); setExMap(new Map(exs.map((e) => [e.id, e]))); })
      .catch((x) => setErr(humanError(x)));
  }, [id]);

  const groups = useMemo(() => {
    if (!data) return [];
    const m = new Map<number, SetRow[]>();
    data.sets.forEach((s) => { if (!m.has(s.exercise_order)) m.set(s.exercise_order, []); m.get(s.exercise_order)!.push(s); });
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([, rows]) => rows);
  }, [data]);

  if (!data) return err ? <ErrorLine>{err}</ErrorLine> : <Loading />;
  const { session, sets } = data;
  const work = sets.filter((s) => s.done && !s.is_warmup);
  const vol = work.reduce((a, s) => a + Number(s.weight_kg ?? 0) * (s.reps ?? 0), 0);
  const mins = session.ended_at ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000) : null;

  return (
    <div>
      <Link to="/progress" className="btn ghost sm" style={{ marginLeft: -8, marginBottom: 12 }}><ChevronLeft /> Progress</Link>
      <header className="page-head" style={{ marginBottom: 'var(--s-5)' }}>
        <div>
          <p className="t-label">{new Date(session.started_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1 className="t-title" style={{ marginTop: 6 }}>{session.name}</h1>
        </div>
      </header>
      <div className="facts">
        {mins != null && <div className="fact"><span className="v num">{mins}</span><span className="k">minutes</span></div>}
        <div className="fact"><span className="v num">{work.length}</span><span className="k">working sets</span></div>
        <div className="fact"><span className="v num">{fmtVolume(vol, unit)}</span><span className="k">{unit} moved</span></div>
      </div>
      {!session.ended_at && <Link className="btn primary" style={{ marginTop: 16 }} to={`/workout/${session.id}`}>Resume this workout</Link>}

      {groups.map((rows) => {
        const ex = exMap.get(rows[0].exercise_id);
        const best = rows.filter((r) => r.weight_kg && r.reps).reduce<SetRow | null>((a, b) => (!a || (e1rm(Number(b.weight_kg), b.reps) ?? 0) > (e1rm(Number(a.weight_kg), a.reps) ?? 0) ? b : a), null);
        return (
          <section key={rows[0].exercise_order} className="ex-block" style={{ paddingBottom: 'var(--s-5)' }}>
            <h2 className="ex-name" style={{ fontSize: '1.375rem' }}><Link to={`/exercises/${rows[0].exercise_id}`}>{ex?.name ?? rows[0].exercise_id}</Link></h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
              <thead>
                <tr className="faint" style={{ fontSize: '0.8125rem', textAlign: 'left' }}>
                  <th style={{ fontWeight: 600, padding: '4px 0', width: 56 }}>Set</th>
                  <th style={{ fontWeight: 600 }}>{ex?.track === 'time' ? 'Held' : ex?.track === 'weight_reps' ? `Weight × reps` : 'Reps'}</th>
                  {ex?.track === 'weight_reps' && <th style={{ fontWeight: 600, textAlign: 'right' }}>Est. 1RM</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--rule)' }}>
                    <td className="num faint" style={{ padding: '10px 0', fontSize: '1.0625rem' }}>{r.is_warmup ? 'W' : rows.filter((x, j) => !x.is_warmup && j <= i).length}</td>
                    <td className="num" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                      {ex?.track === 'time' ? `${r.duration_s}s` : ex?.track === 'weight_reps' ? `${w(Number(r.weight_kg))} × ${r.reps}` : r.reps}
                      {best?.id === r.id && <span className="pr-mark" style={{ marginLeft: 10, verticalAlign: 'middle' }}>TOP SET</span>}
                    </td>
                    {ex?.track === 'weight_reps' && <td className="num muted" style={{ textAlign: 'right', fontSize: '1.0625rem' }}>{r.is_warmup ? '' : w(e1rm(Number(r.weight_kg), r.reps))}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}

      <div style={{ marginTop: 'var(--s-7)' }}>
        {confirm ? (
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <span className="muted">Delete this workout and all {sets.length} sets? Your charts will update.</span>
            <button className="btn danger" onClick={async () => {
              const { error } = await supabase.from('sessions').delete().eq('id', session.id);
              if (error) return setErr(humanError(error));
              toast('Workout deleted');
              nav('/progress');
            }}><Trash2 /> Delete workout</button>
            <button className="btn ghost" onClick={() => setConfirm(false)}>Keep it</button>
          </div>
        ) : (
          <button className="btn danger" onClick={() => setConfirm(true)}><Trash2 /> Delete workout</button>
        )}
        <ErrorLine>{err}</ErrorLine>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { getSession, getExercises } from '../lib/data';
import { supabase, humanError } from '../lib/supabase';
import type { ExerciseLite, Session, SetRow } from '../lib/types';
import { ErrorLine, HoldButton, Loading, PageHead } from '../components/ui';
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
      <PageHead
        back={{ label: 'Progress', to: '/progress' }}
        title={session.name}
        sub={new Date(session.started_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />
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
            <table className="sets-table">
              <thead>
                <tr>
                  <th className="set-n">Set</th>
                  <th>{ex?.track === 'time' ? 'Held' : ex?.track === 'weight_reps' ? `Weight × reps (${unit})` : 'Reps'}</th>
                  {ex?.track === 'weight_reps' && <th className="r">Est. 1RM</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td className="num set-n">{r.is_warmup ? 'W' : rows.filter((x, j) => !x.is_warmup && j <= i).length}</td>
                    <td className="num v">
                      {ex?.track === 'time' ? `${r.duration_s}s` : ex?.track === 'weight_reps' ? `${w(Number(r.weight_kg))} × ${r.reps}` : r.reps}
                      {best?.id === r.id && <span className="tag on top-set">Top set</span>}
                    </td>
                    {ex?.track === 'weight_reps' && <td className="num r muted">{r.is_warmup ? '–' : w(e1rm(Number(r.weight_kg), r.reps))}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}

      <div style={{ marginTop: 'var(--s-7)' }}>
        <div className="danger-zone">
          <HoldButton
            hint="Press and hold to delete this workout"
            onConfirm={async () => {
              const { error } = await supabase.from('sessions').delete().eq('id', session.id);
              if (error) return setErr(humanError(error));
              toast('Workout deleted');
              nav('/progress');
            }}
          >
            <Trash2 /> Hold to delete workout
          </HoldButton>
          <p className="faint t-small">Removes all {sets.length} sets. Your charts update straight away.</p>
        </div>
        <ErrorLine>{err}</ErrorLine>
      </div>
    </div>
  );
}

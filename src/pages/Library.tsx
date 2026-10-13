import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getExercises } from '../lib/data';
import type { ExerciseLite } from '../lib/types';
import { ErrorLine, Loading, Thumb, useDebounced } from '../components/ui';
import { EQUIPMENT, MUSCLES, filterExercises } from '../components/ExercisePicker';
import { humanError } from '../lib/supabase';

const PAGE = 60;

export default function Library() {
  const [params, setParams] = useSearchParams();
  const [all, setAll] = useState<ExerciseLite[] | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [shown, setShown] = useState(PAGE);
  const muscle = params.get('muscle');
  const equip = params.get('equipment');
  const dq = useDebounced(q, 150);

  useEffect(() => { getExercises().then(setAll).catch((e) => setErr(humanError(e))); }, []);
  useEffect(() => setShown(PAGE), [dq, muscle, equip]);

  const results = useMemo(() => (all ? filterExercises(all, dq, muscle, equip) : []), [all, dq, muscle, equip]);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <header className="page-head">
        <div>
          <h1 className="t-title">Exercises</h1>
          <p className="sub">{all ? `${all.length} movements with form cues, from barbell basics to machines.` : 'The full library.'}</p>
        </div>
      </header>

      <div className="stack" style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--stage)', paddingTop: 8, paddingBottom: 12, marginTop: -8 }}>
        <label className="field" style={{ position: 'relative' }}>
          <span className="sr-only">Search exercises</span>
          <Search aria-hidden style={{ position: 'absolute', left: 14, top: 15, width: 18, height: 18, color: 'var(--chalk-3)' }} />
          <input className="input" style={{ paddingLeft: 42 }} placeholder="Search by name, muscle or equipment" value={q} onChange={(e) => setQ(e.target.value)} type="search" />
        </label>
        <div className="chips" role="group" aria-label="Muscle">
          {MUSCLES.map((m) => (
            <button key={m} className="chip" aria-pressed={muscle === m} onClick={() => setParam('muscle', muscle === m ? null : m)}>{m}</button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Equipment">
          {EQUIPMENT.map((m) => (
            <button key={m} className="chip" aria-pressed={equip === m} onClick={() => setParam('equipment', equip === m ? null : m)}>{m}</button>
          ))}
        </div>
      </div>

      <ErrorLine>{err}</ErrorLine>
      {!all && !err && <Loading label="Loading exercises" />}
      {all && (
        <>
          <p className="faint t-small" style={{ margin: '4px 0 8px' }} aria-live="polite">{results.length} {results.length === 1 ? 'exercise' : 'exercises'}</p>
          <div className="list">
            {results.slice(0, shown).map((e) => (
              <Link key={e.id} to={`/exercises/${e.id}`} className="list-item">
                <Thumb ex={e} />
                <span className="grow">
                  <span className="title" style={{ display: 'block' }}>{e.name}</span>
                  <span className="meta">{[e.primary_muscles.join(', '), e.equipment, e.level].filter(Boolean).join(' · ')}</span>
                </span>
                {e.created_by && <span className="tag">Yours</span>}
              </Link>
            ))}
          </div>
          {results.length === 0 && (
            <div className="empty">
              <h3>Nothing matches</h3>
              <p className="muted">Try a shorter search or clear a filter. You can add your own exercise from any workout.</p>
              <button className="btn" onClick={() => { setQ(''); setParams({}, { replace: true }); }}>Clear search and filters</button>
            </div>
          )}
          {results.length > shown && (
            <button className="btn block" style={{ marginTop: 16 }} onClick={() => setShown((s) => s + PAGE * 2)}>
              Show more ({results.length - shown} left)
            </button>
          )}
        </>
      )}
    </div>
  );
}

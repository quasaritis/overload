import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronLeft, Flame, MoreHorizontal, Plus, Trash2, Trophy, X } from 'lucide-react';
import { useApp } from '../lib/app';
import { supabase, humanError } from '../lib/supabase';
import { check, getExercises, getSession, historyFor } from '../lib/data';
import { prescribe, e1rm, isBarbell, type Prescription, type Target } from '../lib/progression';
import { DEFAULT_TARGET } from '../lib/workout';
import { fromDisplay, toDisplay, fmtNum, fmtVolume, fmtDuration } from '../lib/units';
import type { ExerciseLite, PlanExercise, Session, SetRow, Track } from '../lib/types';
import { Barbell, ErrorLine, Lights, Loading, relDate } from '../components/ui';
import { ExercisePicker } from '../components/ExercisePicker';

type Draft = { w: string; r: string; t: string };
type PR = { name: string; kind: string; value: string };

export default function Workout() {
  const { id } = useParams();
  const nav = useNavigate();
  const { w, unit, profile, toast } = useApp();
  const [session, setSession] = useState<Session | null>(null);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [exMap, setExMap] = useState<Map<string, ExerciseLite>>(new Map());
  const [targets, setTargets] = useState<Map<string, PlanExercise>>(new Map());
  const [hist, setHist] = useState<Map<string, SetRow[][]>>(new Map());
  const [err, setErr] = useState('');
  const [picker, setPicker] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [rest, setRest] = useState<{ ends: number; total: number; label: string } | null>(null);
  const [finishing, setFinishing] = useState<'idle' | 'confirm' | 'busy'>('idle');
  const [summary, setSummary] = useState<{ prs: PR[]; sets: number; volume: number; minutes: number } | null>(null);

  const fmtKg = useCallback((kg: number) => `${w(kg)} ${unit}`, [w, unit]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [{ session: s, sets: rows }, exs] = await Promise.all([getSession(id), getExercises()]);
      setSession(s);
      setSets(rows);
      setExMap(new Map(exs.map((e) => [e.id, e])));
      setDrafts(Object.fromEntries(rows.map((r) => [r.id, toDraft(r, unit)])));
      if (s.plan_day_id) {
        const pe = check(await supabase.from('plan_exercises').select('*').eq('plan_day_id', s.plan_day_id)) as PlanExercise[];
        setTargets(new Map(pe.map((p) => [p.exercise_id, p])));
      }
      const ids = [...new Set(rows.map((r) => r.exercise_id))];
      setHist(await historyFor(ids, s.id));
    } catch (x) {
      setErr(humanError(x));
    }
  }, [id, unit]);

  useEffect(() => { load(); }, [load]);

  const blocks = useMemo(() => {
    const m = new Map<number, SetRow[]>();
    sets.forEach((s) => {
      if (!m.has(s.exercise_order)) m.set(s.exercise_order, []);
      m.get(s.exercise_order)!.push(s);
    });
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([order, rows]) => ({ order, exerciseId: rows[0].exercise_id, rows: rows.sort((a, b) => a.set_index - b.set_index) }));
  }, [sets]);

  const targetFor = (exId: string): Target => targets.get(exId) ?? DEFAULT_TARGET;

  const rxFor = useCallback(
    (exId: string): Prescription => prescribe(hist.get(exId) ?? [], targets.get(exId) ?? DEFAULT_TARGET, exMap.get(exId)?.track ?? 'weight_reps', fmtKg),
    [hist, targets, exMap, fmtKg],
  );

  async function patchSet(row: SetRow, patch: Partial<SetRow>) {
    setSets((prev) => prev.map((s) => (s.id === row.id ? { ...s, ...patch } : s)));
    const { error } = await supabase.from('sets').update(patch).eq('id', row.id);
    if (error) setErr(humanError(error));
  }

  function valuesFromDraft(row: SetRow, track: Track, fallback: { w: number | null; r: number | null; t: number | null }) {
    const d = drafts[row.id] ?? toDraft(row, unit);
    const wv = d.w.trim() === '' ? fallback.w : fromDisplay(parseFloat(d.w), unit);
    const rv = d.r.trim() === '' ? fallback.r : parseInt(d.r, 10);
    const tv = d.t.trim() === '' ? fallback.t : parseInt(d.t, 10);
    return {
      weight_kg: track === 'weight_reps' ? (wv != null && !Number.isNaN(wv) ? Math.round(wv * 100) / 100 : null) : null,
      reps: track === 'time' ? null : rv != null && !Number.isNaN(rv) ? rv : null,
      duration_s: track === 'time' ? (tv != null && !Number.isNaN(tv) ? tv : null) : null,
    };
  }

  function placeholderFor(row: SetRow, rows: SetRow[], rx: Prescription) {
    const prev = rows.filter((r) => r.set_index < row.set_index && !r.is_warmup).pop();
    return {
      w: prev?.weight_kg ?? rx.weightKg ?? null,
      r: prev?.reps ?? rx.reps ?? null,
      t: prev?.duration_s ?? rx.durationS ?? null,
    };
  }

  async function toggleDone(row: SetRow, rows: SetRow[]) {
    const ex = exMap.get(row.exercise_id);
    const track = ex?.track ?? 'weight_reps';
    const rx = rxFor(row.exercise_id);
    if (row.done) return patchSet(row, { done: false });
    const vals = valuesFromDraft(row, track, placeholderFor(row, rows, rx));
    if (track === 'weight_reps' && (vals.weight_kg == null || vals.reps == null)) return setErr(`Enter the weight and reps for set ${row.set_index + 1} first.`);
    if ((track === 'bodyweight' || track === 'cardio') && vals.reps == null) return setErr(`Enter the reps for set ${row.set_index + 1} first.`);
    if (track === 'time' && vals.duration_s == null) return setErr(`Enter the seconds held for set ${row.set_index + 1} first.`);
    setErr('');
    setDrafts((d) => ({ ...d, [row.id]: toDraft({ ...row, ...vals }, unit) }));
    await patchSet(row, { ...vals, done: true });
    if (!row.is_warmup) {
      const secs = targets.get(row.exercise_id)?.rest_seconds ?? (ex?.mechanic === 'isolation' ? 90 : 150);
      const next = rows.find((r) => r.set_index > row.set_index && !r.done);
      const label = next ? `Next: set ${next.set_index + 1} of ${ex?.name ?? ''}` : `${ex?.name ?? 'Exercise'} done — move on when ready`;
      if (secs > 0) setRest({ ends: Date.now() + secs * 1000, total: secs, label });
    }
    if (navigator.vibrate) navigator.vibrate(15);
  }

  async function addSet(exId: string, order: number, rows: SetRow[]) {
    const last = rows[rows.length - 1];
    const vals = last ? valuesFromDraft(last, exMap.get(exId)?.track ?? 'weight_reps', { w: last.weight_kg, r: last.reps, t: last.duration_s }) : { weight_kg: null, reps: null, duration_s: null };
    try {
      const row = check(
        await supabase
          .from('sets')
          .insert({ session_id: id, exercise_id: exId, exercise_order: order, set_index: (last?.set_index ?? -1) + 1, ...vals, done: false })
          .select('*')
          .single(),
      ) as SetRow;
      setSets((p) => [...p, row]);
      setDrafts((d) => ({ ...d, [row.id]: toDraft(row, unit) }));
    } catch (x) {
      setErr(humanError(x));
    }
  }

  async function deleteSet(row: SetRow) {
    setMenu(null);
    setSets((p) => p.filter((s) => s.id !== row.id));
    const { error } = await supabase.from('sets').delete().eq('id', row.id);
    if (error) setErr(humanError(error));
  }

  async function removeExercise(order: number) {
    const ids = sets.filter((s) => s.exercise_order === order).map((s) => s.id);
    setSets((p) => p.filter((s) => s.exercise_order !== order));
    setMenu(null);
    const { error } = await supabase.from('sets').delete().in('id', ids);
    if (error) setErr(humanError(error));
  }

  async function addExercise(ex: ExerciseLite) {
    setPicker(false);
    try {
      const h = await historyFor([ex.id], id);
      setHist((m) => new Map(m).set(ex.id, h.get(ex.id) ?? []));
      setExMap((m) => new Map(m).set(ex.id, ex));
      const t = targets.get(ex.id) ?? DEFAULT_TARGET;
      const rx = prescribe(h.get(ex.id) ?? [], t, ex.track, fmtKg);
      const order = (blocks[blocks.length - 1]?.order ?? -1) + 1;
      const rows = Array.from({ length: t.target_sets }, (_, j) => ({
        session_id: id,
        exercise_id: ex.id,
        exercise_order: order,
        set_index: j,
        weight_kg: ex.track === 'weight_reps' ? rx.weightKg : null,
        reps: ex.track === 'time' ? null : rx.reps,
        duration_s: ex.track === 'time' ? rx.durationS ?? 30 : null,
        done: false,
      }));
      const inserted = check(await supabase.from('sets').insert(rows).select('*')) as SetRow[];
      setSets((p) => [...p, ...inserted]);
      setDrafts((d) => ({ ...d, ...Object.fromEntries(inserted.map((r) => [r.id, toDraft(r, unit)])) }));
      setTimeout(() => document.getElementById(`ex-${order}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } catch (x) {
      setErr(humanError(x));
    }
  }

  async function finish() {
    if (!session) return;
    const done = sets.filter((s) => s.done);
    if (!done.length) return setFinishing('confirm');
    setFinishing('busy');
    try {
      const undone = sets.filter((s) => !s.done).map((s) => s.id);
      if (undone.length) check(await supabase.from('sets').delete().in('id', undone));
      check(await supabase.from('sessions').update({ ended_at: new Date().toISOString() }).eq('id', session.id));
      const prs = await findPRs(done, session.id, exMap, fmtKg);
      const working = done.filter((s) => !s.is_warmup);
      setRest(null);
      setSummary({
        prs,
        sets: working.length,
        volume: working.reduce((a, s) => a + Number(s.weight_kg ?? 0) * (s.reps ?? 0), 0),
        minutes: Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000),
      });
    } catch (x) {
      setErr(humanError(x));
      setFinishing('idle');
    }
  }

  async function discard() {
    if (!session) return;
    const { error } = await supabase.from('sessions').delete().eq('id', session.id);
    if (error) return setErr(humanError(error));
    toast('Workout discarded');
    nav('/');
  }

  if (summary) return <Summary s={summary} unit={unit} onDone={() => nav('/')} />;
  if (!session) return err ? <ErrorLine>{err}</ErrorLine> : <Loading label="Loading workout" />;
  if (session.ended_at) return <Navigate to={`/history/${session.id}`} replace />;

  const doneCount = sets.filter((s) => s.done && !s.is_warmup).length;

  return (
    <div>
      <div className="wk-head">
        <Link to="/" className="btn icon ghost" aria-label="Back to Today"><ChevronLeft /></Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.name}</p>
          <Clock since={session.started_at} sets={doneCount} />
        </div>
        <button className="btn primary" onClick={finish} disabled={finishing === 'busy'}>
          {finishing === 'busy' ? 'Saving…' : 'Finish'}
        </button>
      </div>

      {finishing === 'confirm' && (
        <div className="notice stack" style={{ marginBottom: 'var(--s-5)' }} role="alert">
          <p><b>Nothing logged yet.</b> Tick at least one set to save this workout, or throw it away.</p>
          <div className="row">
            <button className="btn danger" onClick={discard}><Trash2 /> Discard workout</button>
            <button className="btn ghost" onClick={() => setFinishing('idle')}>Keep going</button>
          </div>
        </div>
      )}

      <ErrorLine>{err}</ErrorLine>

      {blocks.length === 0 && (
        <div className="empty">
          <h3>Empty bar</h3>
          <p className="muted">Add your first exercise. Overload will pull your last session and call the next attempt.</p>
        </div>
      )}

      {blocks.map((b) => {
        const ex = exMap.get(b.exerciseId);
        const track = ex?.track ?? 'weight_reps';
        const t = targetFor(b.exerciseId);
        const rx = rxFor(b.exerciseId);
        const last = hist.get(b.exerciseId)?.[0];
        const working = b.rows.filter((r) => !r.is_warmup);
        const menuKey = `ex-${b.order}`;
        return (
          <section key={b.order} id={`ex-${b.order}`} className="ex-block" aria-label={ex?.name}>
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <h2 className="ex-name"><Link to={`/exercises/${b.exerciseId}`}>{ex?.name ?? b.exerciseId}</Link></h2>
                <p className="faint t-small" style={{ marginTop: 4 }}>
                  {t.target_sets} × {t.rep_min === t.rep_max ? t.rep_min : `${t.rep_min}–${t.rep_max}`} {track === 'time' ? 'sec hold' : 'reps'}
                  {targets.has(b.exerciseId) ? '' : ' · default range'}
                </p>
              </div>
              <div className="row" style={{ gap: 6, flex: 'none' }}>
                <Lights count={working.length} on={working.filter((r) => r.done).length} />
                <button className="btn icon sm ghost" aria-label={`Options for ${ex?.name}`} aria-expanded={menu === menuKey} onClick={() => setMenu(menu === menuKey ? null : menuKey)}>
                  <MoreHorizontal />
                </button>
              </div>
            </div>

            {menu === menuKey && (
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn danger sm" onClick={() => removeExercise(b.order)}><Trash2 /> Remove from workout</button>
                <button className="btn ghost sm" onClick={() => setMenu(null)}>Cancel</button>
              </div>
            )}

            <AttemptBoard rx={rx} track={track} equipment={ex?.equipment ?? null} unit={unit} barKg={profile?.bar_kg ?? 20} w={w} />

            {last && (
              <p className="last-time" style={{ marginTop: 10 }}>
                Last time ({relDate(last[0].created_at)}):{' '}
                <b>{last.filter((s) => !s.is_warmup).map((s) => fmtSet(s, track, w)).join(', ')}</b>
              </p>
            )}

            <div className="sets">
              <div className="set-cols" aria-hidden>
                <span>Set</span>
                {track === 'weight_reps' && <span>{unit === 'kg' ? 'Kilos' : 'Pounds'}</span>}
                {track !== 'weight_reps' && <span>{track === 'time' ? '' : 'Load'}</span>}
                <span>{track === 'time' ? 'Seconds' : 'Reps'}</span>
                <span />
              </div>
              {b.rows.map((row) => {
                const ph = placeholderFor(row, b.rows, rx);
                const d = drafts[row.id] ?? toDraft(row, unit);
                const workIdx = b.rows.filter((r) => !r.is_warmup && r.set_index <= row.set_index).length;
                const rowMenu = menu === row.id;
                return (
                  <div key={row.id}>
                    <div className={`set-row${row.done ? ' done' : ''}${row.is_warmup ? ' warm' : ''}`}>
                      <button className="idx num" aria-label={`Set ${row.set_index + 1} options`} aria-expanded={rowMenu} onClick={() => setMenu(rowMenu ? null : row.id)}>
                        {row.is_warmup ? 'W' : workIdx}
                      </button>
                      {track === 'weight_reps' ? (
                        <label className="set-cell">
                          <span className="sr-only">Weight in {unit}</span>
                          <input
                            inputMode="decimal"
                            value={d.w}
                            placeholder={ph.w != null ? fmtNum(toDisplay(ph.w, unit)) : '0'}
                            onChange={(e) => setDrafts((x) => ({ ...x, [row.id]: { ...d, w: e.target.value.replace(/[^0-9.]/g, '') } }))}
                            onFocus={(e) => e.target.select()}
                            onBlur={() => {
                              const v = d.w.trim() === '' ? null : fromDisplay(parseFloat(d.w), unit);
                              if (v !== row.weight_kg) patchSet(row, { weight_kg: v != null ? Math.round(v * 100) / 100 : null });
                            }}
                          />
                          <span className="unit">{unit}</span>
                        </label>
                      ) : (
                        <span className="faint" style={{ textAlign: 'center', fontSize: '0.875rem' }}>{track === 'time' ? '' : 'Body'}</span>
                      )}
                      <label className="set-cell">
                        <span className="sr-only">{track === 'time' ? 'Seconds' : 'Reps'}</span>
                        <input
                          inputMode="numeric"
                          value={track === 'time' ? d.t : d.r}
                          placeholder={String((track === 'time' ? ph.t : ph.r) ?? '0')}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, '');
                            setDrafts((x) => ({ ...x, [row.id]: track === 'time' ? { ...d, t: v } : { ...d, r: v } }));
                          }}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => {
                            if (track === 'time') {
                              const v = d.t === '' ? null : parseInt(d.t, 10);
                              if (v !== row.duration_s) patchSet(row, { duration_s: v });
                            } else {
                              const v = d.r === '' ? null : parseInt(d.r, 10);
                              if (v !== row.reps) patchSet(row, { reps: v });
                            }
                          }}
                        />
                        <span className="unit">{track === 'time' ? 's' : '×'}</span>
                      </label>
                      <button className={`tick${row.done ? ' on' : ''}`} aria-pressed={row.done} aria-label={row.done ? `Undo set ${row.set_index + 1}` : `Log set ${row.set_index + 1}`} onClick={() => toggleDone(row, b.rows)}>
                        <Check />
                      </button>
                    </div>
                    {rowMenu && (
                      <div className="row" style={{ padding: '8px 0 4px', flexWrap: 'wrap' }}>
                        <button className="btn sm" onClick={() => { patchSet(row, { is_warmup: !row.is_warmup }); setMenu(null); }}>
                          <Flame /> {row.is_warmup ? 'Make it a working set' : 'Mark as warm-up'}
                        </button>
                        <button className="btn danger sm" onClick={() => deleteSet(row)}><X /> Delete set</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => addSet(b.exerciseId, b.order, b.rows)}>
              <Plus /> Add set
            </button>
          </section>
        );
      })}

      <div className="stack" style={{ marginTop: 'var(--s-6)' }}>
        <button className="btn lg" onClick={() => setPicker(true)}><Plus /> Add exercise</button>
        <button className="btn ghost" onClick={() => setFinishing('confirm')} style={{ justifySelf: 'start' }}>Discard workout</button>
      </div>

      {picker && <ExercisePicker onPick={addExercise} onClose={() => setPicker(false)} />}
      {rest && <RestBar rest={rest} onChange={setRest} />}
    </div>
  );
}

function toDraft(r: Pick<SetRow, 'weight_kg' | 'reps' | 'duration_s'>, unit: 'kg' | 'lb'): Draft {
  const wv = toDisplay(r.weight_kg != null ? Number(r.weight_kg) : null, unit);
  return { w: wv != null ? String(Number(wv.toFixed(2))) : '', r: r.reps != null ? String(r.reps) : '', t: r.duration_s != null ? String(r.duration_s) : '' };
}

function fmtSet(s: SetRow, track: Track, w: (kg: number) => string) {
  if (track === 'time') return `${s.duration_s ?? 0}s`;
  if (track !== 'weight_reps') return `${s.reps ?? 0}`;
  return `${w(Number(s.weight_kg ?? 0))}×${s.reps ?? 0}`;
}

function AttemptBoard({ rx, track, equipment, unit, barKg, w }: { rx: Prescription; track: Track; equipment: string | null; unit: 'kg' | 'lb'; barKg: number; w: (kg: number) => string }) {
  const showBar = track === 'weight_reps' && isBarbell(equipment) && rx.weightKg != null && rx.weightKg >= barKg;
  return (
    <div className="board" style={{ marginTop: 'var(--s-4)', padding: 'var(--s-4)' }}>
      <div className="row between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <span className="lbl">Next attempt</span>
        <span className={`verdict ${rx.verdict}`}>
          {rx.verdict === 'add' ? `+${w(rx.deltaKg)} ${unit}` : rx.verdict === 'deload' ? `Reset ${w(rx.deltaKg)} ${unit}` : rx.verdict === 'start' ? 'First session' : rx.verdict === 'hold' ? 'Hold weight' : 'Chase reps'}
        </span>
      </div>
      <div className="attempt num" style={{ fontSize: 'clamp(2.5rem, 11vw, 3.5rem)' }}>
        {track === 'time' ? (
          <>{rx.durationS}<span className="u">sec</span></>
        ) : rx.weightKg != null ? (
          <>{w(rx.weightKg)}<span className="u">{unit}</span><span className="x">×</span>{rx.reps}</>
        ) : (
          <>{track === 'bodyweight' ? 'BW' : '—'}<span className="x">×</span>{rx.reps}</>
        )}
      </div>
      <p className="muted t-small" style={{ marginTop: 8, maxWidth: '60ch' }}>{rx.reason}</p>
      {showBar && <div style={{ marginTop: 12 }}><Barbell totalKg={rx.weightKg!} barKg={barKg} unit={unit} /></div>}
    </div>
  );
}

function Clock({ since, sets }: { since: string; sets: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return (
    <p className="faint t-small num" style={{ fontSize: '0.9375rem' }}>
      {h ? `${h}:${String(m).padStart(2, '0')}` : m}:{String(s % 60).padStart(2, '0')} · {sets} {sets === 1 ? 'set' : 'sets'} logged
    </p>
  );
}

function RestBar({ rest, onChange }: { rest: { ends: number; total: number; label: string }; onChange: (r: { ends: number; total: number; label: string } | null) => void }) {
  const [now, setNow] = useState(Date.now());
  const buzzed = useRef(false);
  useEffect(() => {
    buzzed.current = false;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [rest.ends]);
  const left = Math.round((rest.ends - now) / 1000);
  useEffect(() => {
    if (left <= 0 && !buzzed.current) {
      buzzed.current = true;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    if (left < -60) onChange(null);
  }, [left, onChange]);
  const over = left <= 0;
  const pct = Math.max(0, Math.min(100, (1 - (rest.ends - now) / (rest.total * 1000)) * 100));
  return (
    <div className={`rest${over ? ' over' : ''}`} role="timer" aria-live="off">
      <span className="t num">{over ? 'GO' : fmtDuration(left)}</span>
      <span className="lbl">{over ? 'Rest is up. ' : ''}{rest.label}</span>
      {!over && <button className="btn sm" onClick={() => onChange({ ...rest, ends: rest.ends + 30000, total: rest.total + 30 })} aria-label="Add 30 seconds">+30</button>}
      <button className="btn sm icon" onClick={() => onChange(null)} aria-label="Close rest timer"><X /></button>
      <span className="bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

async function findPRs(done: SetRow[], sessionId: string, exMap: Map<string, ExerciseLite>, fmt: (kg: number) => string): Promise<PR[]> {
  const ids = [...new Set(done.map((s) => s.exercise_id))];
  if (!ids.length) return [];
  const prev = check(
    await supabase.from('sets').select('exercise_id,weight_kg,reps,duration_s').in('exercise_id', ids).eq('done', true).eq('is_warmup', false).neq('session_id', sessionId).limit(5000),
  ) as Pick<SetRow, 'exercise_id' | 'weight_kg' | 'reps' | 'duration_s'>[];
  const prs: PR[] = [];
  for (const id of ids) {
    const ex = exMap.get(id);
    const mine = done.filter((s) => s.exercise_id === id && !s.is_warmup);
    const before = prev.filter((s) => s.exercise_id === id);
    if (!before.length || !mine.length) continue;
    const track = ex?.track ?? 'weight_reps';
    if (track === 'weight_reps') {
      const bestE = Math.max(...mine.map((s) => e1rm(Number(s.weight_kg), s.reps) ?? 0));
      const prevE = Math.max(...before.map((s) => e1rm(Number(s.weight_kg), s.reps) ?? 0));
      const bestW = Math.max(...mine.map((s) => Number(s.weight_kg ?? 0)));
      const prevW = Math.max(...before.map((s) => Number(s.weight_kg ?? 0)));
      if (bestW > prevW) prs.push({ name: ex?.name ?? id, kind: 'Heaviest weight', value: fmt(bestW) });
      else if (bestE > prevE + 0.01) prs.push({ name: ex?.name ?? id, kind: 'Estimated 1RM', value: fmt(bestE) });
    } else if (track === 'time') {
      const b = Math.max(...mine.map((s) => s.duration_s ?? 0));
      if (b > Math.max(...before.map((s) => s.duration_s ?? 0))) prs.push({ name: ex?.name ?? id, kind: 'Longest hold', value: `${b}s` });
    } else {
      const b = Math.max(...mine.map((s) => s.reps ?? 0));
      if (b > Math.max(...before.map((s) => s.reps ?? 0))) prs.push({ name: ex?.name ?? id, kind: 'Most reps', value: `${b}` });
    }
  }
  return prs;
}

function Summary({ s, unit, onDone }: { s: { prs: PR[]; sets: number; volume: number; minutes: number }; unit: 'kg' | 'lb'; onDone: () => void }) {
  return (
    <div className="stack-lg" style={{ paddingTop: 'var(--s-5)' }}>
      <div className="lights" aria-hidden style={{ gap: 10 }}>
        <i className="on" style={{ width: 22, height: 22 }} /><i className="on" style={{ width: 22, height: 22 }} /><i className="on" style={{ width: 22, height: 22 }} />
      </div>
      <h1 className="t-display">Good lift.</h1>
      <div className="facts">
        <div className="fact"><span className="v num">{s.minutes}</span><span className="k">minutes</span></div>
        <div className="fact"><span className="v num">{s.sets}</span><span className="k">working sets</span></div>
        <div className="fact"><span className="v num">{fmtVolume(s.volume, unit)}</span><span className="k">{unit} moved</span></div>
      </div>
      {s.prs.length > 0 ? (
        <section className="stack">
          <h2 className="t-head">Records</h2>
          <div className="list">
            {s.prs.map((p, i) => (
              <div key={i} className="list-item">
                <Trophy aria-hidden style={{ color: 'var(--plate-15)', width: 22 }} />
                <span className="grow">
                  <span className="title" style={{ display: 'block' }}>{p.name}</span>
                  <span className="meta" style={{ textTransform: 'none' }}>{p.kind}</span>
                </span>
                <span className="num" style={{ fontSize: '1.5rem', fontWeight: 600 }}>{p.value}</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="muted" style={{ maxWidth: '52ch' }}>No new records this time. Your next attempts are already set from what you just lifted.</p>
      )}
      <button className="btn primary lg" onClick={onDone} style={{ justifySelf: 'start' }}>Done</button>
    </div>
  );
}

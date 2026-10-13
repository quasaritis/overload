import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { supabase, humanError } from '../lib/supabase';
import { check, getPlan, getExercises, setActivePlan } from '../lib/data';
import type { ExerciseLite, Plan, PlanDay, PlanExercise } from '../lib/types';
import { ErrorLine, Loading, Thumb } from '../components/ui';
import { ExercisePicker } from '../components/ExercisePicker';
import { useApp } from '../lib/app';
import { defaultIncrementKg, fromDisplay, toDisplay, fmtNum } from '../lib/units';

export default function PlanEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const { unit, toast } = useApp();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [exs, setExs] = useState<PlanExercise[]>([]);
  const [exMap, setExMap] = useState<Map<string, ExerciseLite>>(new Map());
  const [err, setErr] = useState('');
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [r, all] = await Promise.all([getPlan(id), getExercises()]);
      setPlan(r.plan);
      setDays(r.days);
      setExs(r.exercises);
      setExMap(new Map(all.map((e) => [e.id, e])));
    } catch (x) {
      setErr(humanError(x));
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function q<T>(p: PromiseLike<{ data: T | null; error: unknown }>) {
    try { return check(await p); } catch (x) { setErr(humanError(x)); throw x; }
  }

  async function renamePlan(name: string) {
    if (!plan || !name.trim() || name === plan.name) return;
    setPlan({ ...plan, name });
    await q(supabase.from('plans').update({ name: name.trim() }).eq('id', plan.id));
  }

  async function addDay() {
    const row = (await q(supabase.from('plan_days').insert({ plan_id: id, name: `Day ${days.length + 1}`, position: days.length }).select('*').single())) as PlanDay;
    setDays((d) => [...d, row]);
  }

  async function renameDay(day: PlanDay, name: string) {
    if (!name.trim() || name === day.name) return;
    setDays((d) => d.map((x) => (x.id === day.id ? { ...x, name } : x)));
    await q(supabase.from('plan_days').update({ name: name.trim() }).eq('id', day.id));
  }

  async function deleteDay(day: PlanDay) {
    setDays((d) => d.filter((x) => x.id !== day.id));
    await q(supabase.from('plan_days').delete().eq('id', day.id));
  }

  async function moveDay(day: PlanDay, dir: -1 | 1) {
    const i = days.findIndex((d) => d.id === day.id);
    const j = i + dir;
    if (j < 0 || j >= days.length) return;
    const next = [...days];
    [next[i], next[j]] = [next[j], next[i]];
    const withPos = next.map((d, k) => ({ ...d, position: k }));
    setDays(withPos);
    await Promise.all([withPos[i], withPos[j]].map((d) => q(supabase.from('plan_days').update({ position: d.position }).eq('id', d.id))));
  }

  async function addExercise(dayId: string, ex: ExerciseLite) {
    setPickFor(null);
    const pos = exs.filter((e) => e.plan_day_id === dayId).length;
    const compound = ex.mechanic === 'compound' && (ex.equipment === 'barbell' || ex.equipment === 'machine');
    const row = (await q(
      supabase
        .from('plan_exercises')
        .insert({
          plan_day_id: dayId,
          exercise_id: ex.id,
          position: pos,
          target_sets: 3,
          rep_min: ex.track === 'time' ? 30 : compound ? 6 : 8,
          rep_max: ex.track === 'time' ? 60 : compound ? 10 : 12,
          increment_kg: ex.track === 'weight_reps' ? Math.round(defaultIncrementKg(unit, ex.equipment) * 100) / 100 : 0,
          rest_seconds: compound ? 150 : 90,
        })
        .select('*')
        .single(),
    )) as PlanExercise;
    setExMap((m) => new Map(m).set(ex.id, ex));
    setExs((e) => [...e, row]);
    setOpen(row.id);
  }

  async function patchEx(pe: PlanExercise, patch: Partial<PlanExercise>) {
    const merged = { ...pe, ...patch };
    if (merged.rep_max < merged.rep_min) {
      if ('rep_min' in patch) merged.rep_max = merged.rep_min; else merged.rep_min = merged.rep_max;
    }
    setExs((e) => e.map((x) => (x.id === pe.id ? merged : x)));
    await q(supabase.from('plan_exercises').update({ target_sets: merged.target_sets, rep_min: merged.rep_min, rep_max: merged.rep_max, increment_kg: merged.increment_kg, rest_seconds: merged.rest_seconds }).eq('id', pe.id));
  }

  async function moveEx(pe: PlanExercise, dir: -1 | 1) {
    const list = exs.filter((e) => e.plan_day_id === pe.plan_day_id).sort((a, b) => a.position - b.position);
    const i = list.findIndex((e) => e.id === pe.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const updated = list.map((e, k) => ({ ...e, position: k }));
    setExs((all) => all.map((e) => updated.find((u) => u.id === e.id) ?? e));
    await Promise.all([updated[i], updated[j]].map((e) => q(supabase.from('plan_exercises').update({ position: e.position }).eq('id', e.id))));
  }

  async function removeEx(pe: PlanExercise) {
    setExs((e) => e.filter((x) => x.id !== pe.id));
    await q(supabase.from('plan_exercises').delete().eq('id', pe.id));
  }

  async function deletePlan() {
    if (!plan) return;
    await q(supabase.from('plans').delete().eq('id', plan.id));
    toast(`Deleted ${plan.name}`);
    nav('/plans');
  }

  if (!plan) return err ? <ErrorLine>{err}</ErrorLine> : <Loading />;

  return (
    <div>
      <Link to="/plans" className="btn ghost sm" style={{ marginLeft: -8, marginBottom: 12 }}><ChevronLeft /> Plans</Link>
      <header className="page-head" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <label className="field" style={{ flex: '1 1 260px' }}>
          <span className="sr-only">Plan name</span>
          <input
            className="t-title"
            defaultValue={plan.name}
            onBlur={(e) => renamePlan(e.target.value)}
            maxLength={80}
            style={{ background: 'transparent', border: 0, borderBottom: '1px dashed var(--rule-strong)', padding: '4px 0', width: '100%', color: 'var(--chalk)' }}
          />
        </label>
        {plan.is_active ? (
          <span className="pr-mark" style={{ height: 30, padding: '0 12px' }}>ACTIVE PLAN</span>
        ) : (
          <button className="btn" onClick={async () => { await setActivePlan(plan.id); setPlan({ ...plan, is_active: true }); toast(`${plan.name} is now active`); }}>Make active</button>
        )}
      </header>

      <ErrorLine>{err}</ErrorLine>

      {days.length === 0 && <p className="muted" style={{ marginBottom: 16 }}>Add a training day, then put exercises in it.</p>}

      {days.map((day, di) => {
        const list = exs.filter((e) => e.plan_day_id === day.id).sort((a, b) => a.position - b.position);
        return (
          <section key={day.id} className="ex-block" aria-label={day.name}>
            <div className="row between" style={{ gap: 8 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="sr-only">Day name</span>
                <input
                  className="ex-name"
                  defaultValue={day.name}
                  onBlur={(e) => renameDay(day, e.target.value)}
                  maxLength={60}
                  style={{ background: 'transparent', border: 0, padding: '2px 0', width: '100%', color: 'var(--chalk)' }}
                />
              </label>
              <button className="btn sm icon ghost" aria-label="Move day up" disabled={di === 0} onClick={() => moveDay(day, -1)}><ArrowUp /></button>
              <button className="btn sm icon ghost" aria-label="Move day down" disabled={di === days.length - 1} onClick={() => moveDay(day, 1)}><ArrowDown /></button>
              <button className="btn sm icon ghost" aria-label={`Delete ${day.name}`} onClick={() => deleteDay(day)}><Trash2 /></button>
            </div>

            <div className="list" style={{ marginTop: 12 }}>
              {list.map((pe, i) => {
                const ex = exMap.get(pe.exercise_id);
                const isOpen = open === pe.id;
                return (
                  <div key={pe.id}>
                    <button className="list-item" onClick={() => setOpen(isOpen ? null : pe.id)} aria-expanded={isOpen}>
                      {ex && <Thumb ex={ex} size={44} />}
                      <span className="grow">
                        <span className="title" style={{ display: 'block' }}>{ex?.name ?? pe.exercise_id}</span>
                        <span className="meta" style={{ textTransform: 'none' }}>
                          {pe.target_sets} × {pe.rep_min === pe.rep_max ? pe.rep_min : `${pe.rep_min}–${pe.rep_max}`}{ex?.track === 'time' ? 's' : ''}
                          {ex?.track === 'weight_reps' ? ` · +${fmtNum(toDisplay(pe.increment_kg, unit))} ${unit} when earned` : ''}
                          {` · rest ${Math.round(pe.rest_seconds / 30) / 2} min`}
                        </span>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="stack" style={{ padding: '4px 4px 18px', borderBottom: 0 }}>
                        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                          <NumField label="Sets" value={pe.target_sets} min={1} max={12} onCommit={(v) => patchEx(pe, { target_sets: v })} />
                          <NumField label={ex?.track === 'time' ? 'Min seconds' : 'Min reps'} value={pe.rep_min} min={1} max={100} onCommit={(v) => patchEx(pe, { rep_min: v })} />
                          <NumField label={ex?.track === 'time' ? 'Max seconds' : 'Max reps'} value={pe.rep_max} min={1} max={100} onCommit={(v) => patchEx(pe, { rep_max: v })} />
                          {ex?.track === 'weight_reps' && (
                            <NumField label={`Add (${unit})`} value={toDisplay(pe.increment_kg, unit) ?? 0} min={0} max={100} step={0.25} onCommit={(v) => patchEx(pe, { increment_kg: Math.round((fromDisplay(v, unit) ?? 0) * 100) / 100 })} />
                          )}
                          <NumField label="Rest (sec)" value={pe.rest_seconds} min={0} max={900} step={15} onCommit={(v) => patchEx(pe, { rest_seconds: v })} />
                        </div>
                        <p className="faint t-small">When you hit {pe.rep_max} on all {pe.target_sets} sets, the next attempt adds weight and drops back to {pe.rep_min} reps.</p>
                        <div className="row" style={{ flexWrap: 'wrap' }}>
                          <button className="btn sm" disabled={i === 0} onClick={() => moveEx(pe, -1)}><ArrowUp /> Earlier</button>
                          <button className="btn sm" disabled={i === list.length - 1} onClick={() => moveEx(pe, 1)}><ArrowDown /> Later</button>
                          <button className="btn sm danger" onClick={() => removeEx(pe)}><Trash2 /> Remove</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setPickFor(day.id)}><Plus /> Add exercise to {day.name}</button>
          </section>
        );
      })}

      <div className="stack" style={{ marginTop: 'var(--s-5)' }}>
        <button className="btn lg" onClick={addDay} style={{ justifySelf: 'start' }}><Plus /> Add training day</button>
      </div>

      <div className="divider" style={{ marginTop: 'var(--s-7)' }} />
      {confirmDelete ? (
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <span className="muted">Delete {plan.name}? Workouts you’ve logged stay in your history.</span>
          <button className="btn danger" onClick={deletePlan}><Trash2 /> Delete plan</button>
          <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Keep it</button>
        </div>
      ) : (
        <button className="btn danger" onClick={() => setConfirmDelete(true)}><Trash2 /> Delete plan</button>
      )}

      {pickFor && <ExercisePicker title={`Add to ${days.find((d) => d.id === pickFor)?.name ?? 'day'}`} onPick={(e) => addExercise(pickFor, e)} onClose={() => setPickFor(null)} />}
    </div>
  );
}

function NumField({ label, value, min, max, step = 1, onCommit }: { label: string; value: number; min: number; max: number; step?: number; onCommit: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="input num"
        style={{ fontSize: '1.25rem', fontWeight: 600 }}
        inputMode="decimal"
        value={v}
        onChange={(e) => setV(e.target.value.replace(/[^0-9.]/g, ''))}
        onFocus={(e) => e.target.select()}
        onBlur={() => {
          let n = parseFloat(v);
          if (Number.isNaN(n)) n = value;
          n = Math.min(max, Math.max(min, Math.round(n / step) * step));
          setV(String(n));
          if (n !== value) onCommit(n);
        }}
      />
    </label>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Plus, RotateCcw } from 'lucide-react';
import { useApp } from '../lib/app';
import { getActivePlan, nextDay, historyFor, openSession, recentSessions, getExercises } from '../lib/data';
import { prescribe, type Prescription } from '../lib/progression';
import { startWorkout } from '../lib/workout';
import type { ExerciseLite, PlanDay, PlanExercise, Session } from '../lib/types';
import { ErrorLine, Loading, relDate } from '../components/ui';
import { humanError } from '../lib/supabase';
import { fmtVolume } from '../lib/units';
import { dailyTotals } from '../lib/foodData';

type Active = Awaited<ReturnType<typeof getActivePlan>>;

export default function Today() {
  const { profile, w, unit } = useApp();
  const nav = useNavigate();
  const [plan, setPlan] = useState<Active>(null);
  const [day, setDay] = useState<PlanDay | null>(null);
  const [open, setOpen] = useState<Session | null>(null);
  const [rx, setRx] = useState<Map<string, Prescription>>(new Map());
  const [exMap, setExMap] = useState<Map<string, ExerciseLite>>(new Map());
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof recentSessions>>>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState('');
  const [food, setFood] = useState<{ kcal: number; protein: number } | null>(null);

  useEffect(() => {
    const d = new Date().toLocaleDateString('en-CA');
    dailyTotals(d, d).then((m) => setFood(m.get(d) ?? { kcal: 0, protein: 0 })).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [p, o, r, exs] = await Promise.all([getActivePlan(), openSession(), recentSessions(12), getExercises()]);
        setPlan(p);
        setOpen(o);
        setRecent(r);
        setExMap(new Map(exs.map((e) => [e.id, e])));
        if (p) setDay(await nextDay(p.days));
      } catch (x) {
        setErr(humanError(x));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dayExercises: PlanExercise[] = plan && day ? plan.exercises.filter((e) => e.plan_day_id === day.id) : [];

  useEffect(() => {
    if (!dayExercises.length) return setRx(new Map());
    historyFor(dayExercises.map((e) => e.exercise_id)).then((h) => {
      const m = new Map<string, Prescription>();
      dayExercises.forEach((pe) => {
        const track = exMap.get(pe.exercise_id)?.track ?? 'weight_reps';
        m.set(pe.id, prescribe(h.get(pe.exercise_id) ?? [], pe, track, (kg) => `${w(kg)} ${unit}`));
      });
      setRx(m);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day?.id, plan, exMap]);

  async function start(withPlan: boolean) {
    setStarting(true);
    setErr('');
    try {
      const id = await startWorkout(withPlan ? day : null, withPlan ? dayExercises : [], (kg) => `${w(kg)} ${unit}`);
      nav(`/workout/${id}`);
    } catch (x) {
      setErr(humanError(x));
      setStarting(false);
    }
  }

  if (loading) return <Loading />;

  const weekStart = startOfWeek();
  const thisWeek = recent.filter((s) => new Date(s.started_at) >= weekStart);
  const weekSets = thisWeek.flatMap((s) => s.sets.filter((x) => x.done && !x.is_warmup));
  const weekVolume = weekSets.reduce((a, s) => a + Number(s.weight_kg ?? 0) * (s.reps ?? 0), 0);
  const hello = profile?.display_name ? `${profile.display_name.split(' ')[0]}` : null;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <header className="page-head" style={{ marginBottom: 'var(--s-5)' }}>
        <div>
          <p className="t-label">{today}{hello ? ` · ${hello}` : ''}</p>
          <h1 className="t-title" style={{ marginTop: 6 }}>{open ? 'Workout in progress' : day ? day.name : 'Today'}</h1>
        </div>
      </header>

      <ErrorLine>{err}</ErrorLine>

      {open && (
        <div className="board" style={{ marginBottom: 'var(--s-6)' }}>
          <p className="lbl">Started {new Date(open.started_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>
          <p className="t-head" style={{ marginTop: 8, fontSize: '1.75rem' }}>{open.name}</p>
          <Link to={`/workout/${open.id}`} className="btn primary lg" style={{ marginTop: 18 }}>
            <RotateCcw /> Resume workout
          </Link>
        </div>
      )}

      {!open && plan && day && (
        <section aria-labelledby="next-h">
          {plan.days.length > 1 && (
            <div className="chips" role="group" aria-label="Choose day" style={{ marginBottom: 'var(--s-4)' }}>
              {plan.days.map((d) => (
                <button key={d.id} className="chip" aria-pressed={d.id === day.id} onClick={() => setDay(d)} style={{ textTransform: 'none' }}>
                  {d.name}
                </button>
              ))}
            </div>
          )}
          <h2 id="next-h" className="sr-only">Next attempts</h2>
          {dayExercises.length === 0 ? (
            <div className="empty">
              <h3>{day.name} has no exercises yet</h3>
              <Link className="btn" to={`/plans/${plan.plan.id}`}>Add exercises to {plan.plan.name}</Link>
            </div>
          ) : (
            <ol className="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {dayExercises.map((pe) => {
                const ex = exMap.get(pe.exercise_id);
                const p = rx.get(pe.id);
                return (
                  <li key={pe.id} className="list-item" style={{ alignItems: 'center', gap: 16, padding: '16px 4px' }}>
                    <div className="grow">
                      <Link to={`/exercises/${pe.exercise_id}`} className="title" style={{ display: 'block', textDecoration: 'none' }}>{ex?.name ?? pe.exercise_id}</Link>
                      <span className="meta">
                        {pe.target_sets} sets · {pe.rep_min === pe.rep_max ? pe.rep_min : `${pe.rep_min}–${pe.rep_max}`} {ex?.track === 'time' ? 'hold' : 'reps'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {p ? <Attempt p={p} track={ex?.track} w={w} unit={unit} /> : <span className="faint">…</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <div className="row" style={{ marginTop: 'var(--s-5)', flexWrap: 'wrap' }}>
            <button className="btn primary lg" onClick={() => start(true)} disabled={starting || dayExercises.length === 0}>
              <Play /> {starting ? 'Loading the bar…' : `Start ${day.name}`}
            </button>
            <button className="btn lg" onClick={() => start(false)} disabled={starting}>
              <Plus /> Empty workout
            </button>
          </div>
        </section>
      )}

      {!open && !plan && (
        <div className="empty" style={{ paddingTop: 0 }}>
          <h3>No active plan</h3>
          <p className="muted" style={{ maxWidth: '52ch' }}>Pick a starter plan or build your own. Labour Chowk needs a plan to call your next attempt — or just log a free workout.</p>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <Link to="/plans" className="btn primary lg">Choose a plan <ArrowRight /></Link>
            <button className="btn lg" onClick={() => start(false)} disabled={starting}><Plus /> Empty workout</button>
          </div>
        </div>
      )}

      {food && (
        <section className="section">
          <div className="row between" style={{ marginBottom: 'var(--s-4)' }}>
            <h2 className="t-head">Food today</h2>
            <Link to="/food" className="btn ghost sm">{food.kcal ? 'Open log' : 'Log food'} <ArrowRight /></Link>
          </div>
          <div className="facts">
            <div className="fact">
              <span className="v num">{Math.round(food.kcal).toLocaleString('en-IN')}{profile?.kcal_target ? <span className="faint" style={{ fontSize: '0.6em' }}> / {profile.kcal_target.toLocaleString('en-IN')}</span> : null}</span>
              <span className="k">kcal eaten</span>
            </div>
            <div className="fact">
              <span className="v num">{Math.round(food.protein)}{profile?.protein_target_g ? <span className="faint" style={{ fontSize: '0.6em' }}> / {profile.protein_target_g}</span> : null}</span>
              <span className="k">g protein</span>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="t-head">This week</h2>
        <div className="facts" style={{ marginTop: 'var(--s-4)' }}>
          <div className="fact"><span className="v num">{thisWeek.length}</span><span className="k">sessions</span></div>
          <div className="fact"><span className="v num">{weekSets.length}</span><span className="k">working sets</span></div>
          <div className="fact"><span className="v num">{fmtVolume(weekVolume, unit)}</span><span className="k">{unit} moved</span></div>
        </div>
      </section>

      <section className="section">
        <div className="row between" style={{ marginBottom: 'var(--s-3)' }}>
          <h2 className="t-head">Recent sessions</h2>
          {recent.length > 0 && <Link to="/progress" className="btn ghost sm">All history</Link>}
        </div>
        {recent.length === 0 ? (
          <p className="muted">Your finished workouts show up here.</p>
        ) : (
          <div className="list">
            {recent.slice(0, 5).map((s) => {
              const done = s.sets.filter((x) => x.done && !x.is_warmup);
              const vol = done.reduce((a, x) => a + Number(x.weight_kg ?? 0) * (x.reps ?? 0), 0);
              return (
                <Link key={s.id} to={`/history/${s.id}`} className="list-item">
                  <span className="grow">
                    <span className="title" style={{ display: 'block' }}>{s.name}</span>
                    <span className="meta" style={{ textTransform: 'none' }}>{relDate(s.started_at)} · {done.length} sets · {fmtVolume(vol, unit)} {unit}</span>
                  </span>
                  <ArrowRight aria-hidden style={{ color: 'var(--chalk-3)', width: 18 }} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Attempt({ p, track, w, unit }: { p: Prescription; track?: string; w: (kg: number) => string; unit: string }) {
  if (track === 'time') return <span className="num" style={{ fontSize: '1.5rem', fontWeight: 600 }}>{p.durationS}s</span>;
  return (
    <div style={{ display: 'grid', justifyItems: 'end', gap: 4 }}>
      <span className="num" style={{ fontSize: '1.625rem', fontWeight: 600, lineHeight: 1 }}>
        {p.weightKg != null ? <>{w(p.weightKg)}<span style={{ fontSize: '0.6em', color: 'var(--chalk-3)' }}> {unit}</span> × </> : track === 'bodyweight' ? 'BW × ' : 'Find weight × '}
        {p.reps}
      </span>
      {p.verdict === 'add' && <span className="verdict add">+{w(p.deltaKg)} {unit}</span>}
      {p.verdict === 'deload' && <span className="verdict deload">Reset −10%</span>}
    </div>
  );
}

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday start
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

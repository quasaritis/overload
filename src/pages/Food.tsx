import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Plus, Target, Utensils } from 'lucide-react';
import { useApp } from '../lib/app';
import { MEALS, ZERO, add, fmtQty, isoDay, macroSplit, mealForNow, shiftDay, type Meal, type Nutr } from '../lib/food';
import { dailyTotals, entriesFor, photoUrls } from '../lib/foodData';
import { humanError } from '../lib/supabase';
import type { FoodEntry } from '../lib/types';
import { ErrorLine, Loading } from '../components/ui';
import { AddFood } from '../components/food/AddFood';
import { EntrySheet } from '../components/food/EntrySheet';
import { TargetsSheet } from '../components/food/TargetsSheet';
import { gFmt, kcalFmt } from '../components/food/bits';

const entryNutr = (e: FoodEntry): Nutr => ({ kcal: Number(e.kcal), p: Number(e.protein_g), c: Number(e.carbs_g), f: Number(e.fat_g), fb: Number(e.fibre_g) });

function dayTitle(iso: string) {
  const today = isoDay(new Date());
  if (iso === today) return 'Today';
  if (iso === shiftDay(today, -1)) return 'Yesterday';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Food() {
  const { profile } = useApp();
  const today = isoDay(new Date());
  const [day, setDay] = useState(today);
  const [entries, setEntries] = useState<FoodEntry[] | null>(null);
  const [week, setWeek] = useState<Map<string, { kcal: number; protein: number }>>(new Map());
  const [photos, setPhotos] = useState<Map<string, string>>(new Map());
  const [adding, setAdding] = useState<{ meal: Meal; tab?: 'dish' | 'photo' } | null>(null);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [targets, setTargets] = useState(false);
  const [err, setErr] = useState('');

  const weekFrom = shiftDay(today, -6);

  const loadWeek = useCallback(() => {
    dailyTotals(weekFrom, today).then(setWeek).catch(() => {});
  }, [weekFrom, today]);

  useEffect(() => {
    setEntries(null);
    setErr('');
    entriesFor(day)
      .then(async (rows) => {
        setEntries(rows);
        const paths = rows.map((r) => r.photo_path).filter((p): p is string => Boolean(p));
        if (paths.length) setPhotos(await photoUrls(paths));
      })
      .catch((e) => {
        setErr(humanError(e));
        setEntries([]);
      });
  }, [day]);

  useEffect(loadWeek, [loadWeek]);

  const total = useMemo(() => (entries ?? []).reduce((a, e) => add(a, entryNutr(e)), ZERO), [entries]);
  const byMeal = useMemo(() => {
    const m = new Map<Meal, FoodEntry[]>(MEALS.map((x) => [x.id, []]));
    (entries ?? []).forEach((e) => m.get(e.meal)?.push(e));
    return m;
  }, [entries]);

  const target = profile?.kcal_target ?? null;
  const proteinT = profile?.protein_target_g ?? null;

  function changed(rows: FoodEntry[]) {
    setEntries((xs) => [...(xs ?? []), ...rows.filter((r) => r.eaten_on === day)]);
    const paths = rows.map((r) => r.photo_path).filter((p): p is string => Boolean(p));
    if (paths.length) photoUrls(paths).then((m) => setPhotos((old) => new Map([...old, ...m])));
    loadWeek();
  }

  return (
    <div>
      <header className="page-head food-head">
        <div className="day-nav">
          <button className="btn icon ghost" onClick={() => setDay(shiftDay(day, -1))} aria-label="Previous day"><ChevronLeft /></button>
          <h1 className="t-title">{dayTitle(day)}</h1>
          <button className="btn icon ghost" onClick={() => setDay(shiftDay(day, 1))} disabled={day >= today} aria-label="Next day"><ChevronRight /></button>
        </div>
        <button className="btn ghost sm" onClick={() => setTargets(true)}><Target /> {target ? 'Targets' : 'Set target'}</button>
      </header>

      <ErrorLine>{err}</ErrorLine>

      <Scoreboard total={total} target={target} proteinT={proteinT} byMeal={byMeal} onSetTarget={() => setTargets(true)} />

      <div className="row food-cta">
        <button className="btn primary lg" onClick={() => setAdding({ meal: day === today ? mealForNow() : 'lunch' })}><Plus /> Add food</button>
        <button className="btn lg" onClick={() => setAdding({ meal: day === today ? mealForNow() : 'lunch', tab: 'photo' })}><Camera /> Snap a plate</button>
      </div>

      {!entries ? (
        <Loading label="Loading your day" />
      ) : (
        <div className="meals">
          {MEALS.map((m) => {
            const rows = byMeal.get(m.id) ?? [];
            const kcal = rows.reduce((a, e) => a + Number(e.kcal), 0);
            return (
              <section key={m.id} className="meal" aria-labelledby={`meal-${m.id}`}>
                <div className="meal-head">
                  <h2 id={`meal-${m.id}`} className="t-head">{m.label}</h2>
                  {rows.length > 0 && <span className="num meal-k">{kcalFmt(kcal)} kcal</span>}
                  <button className="btn ghost sm" onClick={() => setAdding({ meal: m.id })} aria-label={`Add to ${m.label}`}><Plus /> Add</button>
                </div>
                {rows.length > 0 && (
                  <div className="list">
                    {rows.map((e) => {
                      const url = e.photo_path ? photos.get(e.photo_path) : undefined;
                      return (
                        <button key={e.id} className="list-item food-row" onClick={() => setEditing(e)}>
                          {url ? <img className="thumb" src={url} alt="" width={44} height={44} /> : null}
                          <span className="grow">
                            <span className="title" style={{ display: 'block' }}>{e.name}</span>
                            <span className="meta" style={{ textTransform: 'none' }}>
                              {e.unit ? (e.unit === 'g' ? `${Math.round(Number(e.qty))} g` : `${fmtQty(Number(e.qty))} ${e.unit}`) : 'Quick add'} · {gFmt(Number(e.protein_g))} g protein
                            </span>
                          </span>
                          <span className="kcal num">{kcalFmt(Number(e.kcal))}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {entries && entries.length === 0 && day === today && (
        <div className="empty" style={{ paddingTop: 0 }}>
          <p className="muted" style={{ maxWidth: '52ch' }}>
            Nothing logged yet. Search 190+ Indian dishes in standard katori and roti portions, build a plate from ingredients, or snap a photo and let it estimate.
          </p>
        </div>
      )}

      <WeekStrip week={week} today={today} day={day} target={target} onPick={setDay} />

      {adding && <AddFood day={day} meal={adding.meal} startTab={adding.tab} onClose={() => setAdding(null)} onAdded={changed} />}
      {editing && (
        <EntrySheet
          entry={editing}
          photoUrl={editing.photo_path ? photos.get(editing.photo_path) : undefined}
          onClose={() => setEditing(null)}
          onChanged={(x) => { setEntries((xs) => (xs ?? []).map((y) => (y.id === x.id ? x : y))); loadWeek(); }}
          onDeleted={(id) => { setEntries((xs) => (xs ?? []).filter((y) => y.id !== id)); loadWeek(); }}
        />
      )}
      {targets && <TargetsSheet onClose={() => setTargets(false)} />}
    </div>
  );
}

const MEAL_TONE: Record<Meal, string> = { breakfast: 'var(--meal-1)', lunch: 'var(--meal-2)', snack: 'var(--meal-3)', dinner: 'var(--meal-4)' };

function Scoreboard({ total, target, proteinT, byMeal, onSetTarget }: { total: Nutr; target: number | null; proteinT: number | null; byMeal: Map<Meal, FoodEntry[]>; onSetTarget: () => void }) {
  const eaten = Math.round(total.kcal);
  const left = target ? target - eaten : null;
  const over = left != null && left < 0;
  const scaleMax = Math.max(target ?? 0, eaten, 1);
  const split = target && proteinT ? macroSplit(target, proteinT) : null;
  const proteinHit = proteinT != null && total.p >= proteinT;

  const segs = MEALS.map((m) => ({ m, k: (byMeal.get(m.id) ?? []).reduce((a, e) => a + Number(e.kcal), 0) })).filter((s) => s.k > 0);

  return (
    <div className="board food-board">
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <p className="lbl">{target ? (over ? 'Over target' : 'Calories left') : 'Eaten'}</p>
        {proteinHit && <span className="verdict add">Protein target hit</span>}
      </div>
      <p className={`attempt${over ? ' over' : ''}`}>
        <span className="num">{kcalFmt(target ? Math.abs(left!) : eaten)}</span>
        <span className="u">kcal</span>
      </p>
      {target ? (
        <p className="muted t-small" style={{ marginTop: 6 }}><span className="num">{kcalFmt(eaten)}</span> eaten of <span className="num">{kcalFmt(target)}</span></p>
      ) : (
        <button className="btn sm" style={{ marginTop: 12 }} onClick={onSetTarget}><Target /> Set a daily target</button>
      )}

      <div className="cal-track" role="img" aria-label={`${eaten} kcal eaten${target ? ` of ${target}` : ''}`}>
        {segs.map((s) => (
          <span key={s.m.id} style={{ width: `${(s.k / scaleMax) * 100}%`, background: MEAL_TONE[s.m.id] }} />
        ))}
        {target && over && <i className="cal-target" style={{ left: `${(target / scaleMax) * 100}%` }} />}
      </div>
      {segs.length > 0 && (
        <p className="cal-legend">
          {segs.map((s) => (
            <span key={s.m.id}><i style={{ background: MEAL_TONE[s.m.id] }} />{s.m.label} <b className="num">{kcalFmt(s.k)}</b></span>
          ))}
        </p>
      )}

      <div className="macro-bars">
        <MacroBar label="Protein" v={total.p} t={proteinT} tone="var(--data)" />
        <MacroBar label="Carbs" v={total.c} t={split?.carbs ?? null} tone="var(--chalk-3)" />
        <MacroBar label="Fat" v={total.f} t={split?.fat ?? null} tone="var(--chalk-3)" />
      </div>
    </div>
  );
}

function MacroBar({ label, v, t, tone }: { label: string; v: number; t: number | null; tone: string }) {
  const pct = t ? Math.min(100, (v / t) * 100) : 0;
  return (
    <div className="hbar">
      <span className="k">{label}</span>
      <span className="track">{t ? <span className="fill" style={{ width: `${pct}%`, background: tone }} /> : null}</span>
      <span className="v num">{gFmt(v)}{t ? <span className="faint"> / {t}</span> : null}<small> g</small></span>
    </div>
  );
}

function WeekStrip({ week, today, day, target, onPick }: { week: Map<string, { kcal: number; protein: number }>; today: string; day: string; target: number | null; onPick: (d: string) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));
  const vals = days.map((d) => week.get(d)?.kcal ?? 0);
  const logged = vals.filter((v) => v > 0);
  const max = Math.max(target ?? 0, ...vals, 1);
  const avg = logged.length ? logged.reduce((a, b) => a + b, 0) / logged.length : 0;
  const avgP = logged.length ? days.reduce((a, d) => a + (week.get(d)?.protein ?? 0), 0) / logged.length : 0;
  return (
    <section className="section">
      <div className="row between" style={{ marginBottom: 'var(--s-4)', alignItems: 'baseline' }}>
        <h2 className="t-head">Last 7 days</h2>
        {logged.length > 0 && (
          <p className="faint t-small">avg <b className="num" style={{ color: 'var(--chalk)' }}>{kcalFmt(avg)}</b> kcal · <b className="num" style={{ color: 'var(--chalk)' }}>{gFmt(avgP)}</b> g protein on {logged.length} logged day{logged.length === 1 ? '' : 's'}</p>
        )}
      </div>
      <div className="week" role="group" aria-label="Pick a day">
        {days.map((d, i) => {
          const v = vals[i];
          const [y, m, dd] = d.split('-').map(Number);
          const dt = new Date(y, m - 1, dd);
          return (
            <button key={d} className="week-day" aria-pressed={d === day} onClick={() => onPick(d)} aria-label={`${dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}: ${Math.round(v)} kcal`}>
              <span className="week-col">
                <span className={`week-bar${target && v > target ? ' over' : ''}`} style={{ height: `${(v / max) * 100}%` }} />
                {target ? <i className="week-t" style={{ bottom: `${(target / max) * 100}%` }} aria-hidden /> : null}
              </span>
              <span className="week-k num">{v ? kcalFmt(v) : '—'}</span>
              <span className="week-d">{dt.toLocaleDateString('en-IN', { weekday: 'narrow' })}</span>
            </button>
          );
        })}
      </div>
      {logged.length === 0 && <p className="faint t-small" style={{ marginTop: 'var(--s-3)' }}><Utensils style={{ width: 14, height: 14, verticalAlign: '-2px' }} /> Log a few days to see your week here.</p>}
    </section>
  );
}

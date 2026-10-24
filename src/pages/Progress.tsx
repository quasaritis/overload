import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trash2 } from 'lucide-react';
import { useApp } from '../lib/app';
import { allSetsFor, bodyMetrics, deleteBodyweight, getExercises, logBodyweight, loggedExerciseIds, recentSessions, setsSince } from '../lib/data';
import { e1rm } from '../lib/progression';
import type { BodyMetric, ExerciseLite } from '../lib/types';
import { ErrorLine, Loading, PageHead, SectionHead, relDate } from '../components/ui';
import { LineChart } from '../components/LineChart';
import { fmtVolume, fromDisplay, toDisplay, fmtNum } from '../lib/units';
import { humanError } from '../lib/supabase';

export default function Progress() {
  const { w, unit, toast } = useApp();
  const [exMap, setExMap] = useState<Map<string, ExerciseLite>>(new Map());
  const [logged, setLogged] = useState<{ id: string; count: number }[] | null>(null);
  const [pick, setPick] = useState<string>('');
  const [series, setSeries] = useState<Awaited<ReturnType<typeof allSetsFor>> | null>(null);
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof recentSessions>> | null>(null);
  const [eightWeeks, setEightWeeks] = useState<Awaited<ReturnType<typeof setsSince>>>([]);
  const [bw, setBw] = useState<BodyMetric[]>([]);
  const [bwInput, setBwInput] = useState('');
  const [bwDate, setBwDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [err, setErr] = useState('');

  const since = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7 * 7);
    return d;
  }, []);

  useEffect(() => {
    Promise.all([getExercises(), loggedExerciseIds(), recentSessions(60), setsSince(since.toISOString()), bodyMetrics()])
      .then(([exs, ids, r, s8, b]) => {
        const m = new Map(exs.map((e) => [e.id, e]));
        setExMap(m);
        const weighted = ids.filter((x) => m.get(x.id));
        setLogged(weighted);
        const firstWeighted = weighted.find((x) => m.get(x.id)?.track === 'weight_reps') ?? weighted[0];
        if (firstWeighted) setPick(firstWeighted.id);
        setRecent(r);
        setEightWeeks(s8);
        setBw(b);
      })
      .catch((x) => setErr(humanError(x)));
  }, [since]);

  useEffect(() => {
    if (!pick) return;
    setSeries(null);
    allSetsFor(pick).then(setSeries).catch((x) => setErr(humanError(x)));
  }, [pick]);

  const pickEx = exMap.get(pick);
  const points = useMemo(() => {
    if (!series || !pickEx) return [];
    const by = new Map<string, typeof series>();
    series.filter((s) => !s.is_warmup).forEach((s) => {
      if (!by.has(s.session_id)) by.set(s.session_id, []);
      by.get(s.session_id)!.push(s);
    });
    return [...by.values()].map((rows) => {
      const t = new Date(rows[0].sessions.started_at).getTime();
      if (pickEx.track === 'weight_reps') {
        const best = rows.reduce((a, b) => ((e1rm(Number(b.weight_kg), b.reps) ?? 0) > (e1rm(Number(a.weight_kg), a.reps) ?? 0) ? b : a));
        return { t, y: e1rm(Number(best.weight_kg), best.reps) ?? 0, note: `${w(Number(best.weight_kg))}×${best.reps}` };
      }
      if (pickEx.track === 'time') return { t, y: Math.max(...rows.map((r) => r.duration_s ?? 0)) };
      return { t, y: Math.max(...rows.map((r) => r.reps ?? 0)) };
    }).sort((a, b) => a.t - b.t);
  }, [series, pickEx, w]);

  const weeks = useMemo(() => {
    const out: { start: Date; volume: number; sets: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const s = new Date(since);
      s.setDate(s.getDate() + i * 7);
      out.push({ start: s, volume: 0, sets: 0 });
    }
    eightWeeks.filter((s) => !s.is_warmup).forEach((s) => {
      const t = new Date(s.sessions.started_at).getTime();
      const idx = Math.floor((t - since.getTime()) / (7 * 86400000));
      if (idx >= 0 && idx < 8) {
        out[idx].volume += Number(s.weight_kg ?? 0) * (s.reps ?? 0);
        out[idx].sets += 1;
      }
    });
    return out;
  }, [eightWeeks, since]);

  const muscles = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    const m = new Map<string, number>();
    eightWeeks.filter((s) => !s.is_warmup && new Date(s.sessions.started_at).getTime() >= weekAgo).forEach((s) => {
      const ex = exMap.get(s.exercise_id);
      ex?.primary_muscles.forEach((mu) => m.set(mu, (m.get(mu) ?? 0) + 1));
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [eightWeeks, exMap]);

  async function addBw(e: React.FormEvent) {
    e.preventDefault();
    const v = fromDisplay(parseFloat(bwInput), unit);
    if (!v || v < 20 || v > 400) return setErr(`Enter a body weight between ${unit === 'kg' ? '20 and 400 kg' : '45 and 880 lb'}.`);
    setErr('');
    try {
      await logBodyweight(bwDate, v);
      setBw(await bodyMetrics());
      setBwInput('');
      toast('Body weight saved');
    } catch (x) {
      setErr(humanError(x));
    }
  }

  if (!logged || !recent) return err ? <ErrorLine>{err}</ErrorLine> : <Loading />;

  const maxVol = Math.max(1, ...weeks.map((x) => x.volume));
  const maxMuscle = Math.max(1, ...muscles.map((m) => m[1]));
  const firstPt = points[0];
  const lastPt = points[points.length - 1];

  return (
    <div>
      <PageHead
        title="Progress"
        sub={recent.length
          ? `${recent.length}${recent.length === 60 ? '+' : ''} workout${recent.length === 1 ? '' : 's'} since ${new Date(recent[recent.length - 1].started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
          : 'Nothing logged yet. Finish a workout and it shows up here.'}
      />
      <ErrorLine>{err}</ErrorLine>

      <section aria-labelledby="lift-h">
        <SectionHead
          id="lift-h"
          title="Lift progress"
          action={logged.length > 0 ? (
            <label className="field section-pick">
              <span className="sr-only">Exercise</span>
              <select className="select" value={pick} onChange={(e) => setPick(e.target.value)}>
                {logged.map((x) => <option key={x.id} value={x.id}>{exMap.get(x.id)?.name} ({x.count} sets)</option>)}
              </select>
            </label>
          ) : undefined}
        />
        {logged.length === 0 ? (
          <p className="muted">Finish a workout and your lifts will chart here.</p>
        ) : !series ? <Loading /> : points.length < 2 ? (
          <p className="muted">One session of {pickEx?.name} so far. The line starts after your second.</p>
        ) : (
          <>
            <div className="facts" style={{ marginBottom: 'var(--s-4)' }}>
              <div className="fact">
                <span className="v num">{pickEx?.track === 'weight_reps' ? w(lastPt.y) : fmtNum(lastPt.y, 0)}</span>
                <span className="k">{pickEx?.track === 'weight_reps' ? `latest est. 1RM (${unit})` : pickEx?.track === 'time' ? 'latest best hold (s)' : 'latest best reps'}</span>
              </div>
              <div className="fact">
                <span className="v num" style={{ color: lastPt.y >= firstPt.y ? 'var(--gain-ink)' : 'var(--nolift-ink)' }}>
                  {lastPt.y >= firstPt.y ? '+' : '−'}{pickEx?.track === 'weight_reps' ? w(Math.abs(lastPt.y - firstPt.y)) : fmtNum(Math.abs(lastPt.y - firstPt.y), 0)}
                </span>
                <span className="k">since {new Date(firstPt.t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
            <LineChart points={points} fmt={(v) => (pickEx?.track === 'weight_reps' ? w(v) : fmtNum(v, 0))} />
            <Link to={`/exercises/${pick}`} className="btn ghost sm" style={{ marginTop: 8 }}>Every set of {pickEx?.name} <ArrowRight /></Link>
          </>
        )}
      </section>

      <div className="pair section">
        <section aria-labelledby="vol-h">
          <SectionHead id="vol-h" title="Weekly volume" sub={`Weight × reps of working sets, last 8 weeks (${unit})`} />
          <div className="vol" role="img" aria-label={`Weekly volume for the last 8 weeks. This week ${fmtVolume(weeks[7].volume, unit)} ${unit}.`}>
            {weeks.map((wk, i) => (
              <div key={i} className={`vol-col${i === 7 ? ' now' : ''}`} title={`${fmtVolume(wk.volume, unit)} ${unit} · ${wk.sets} sets`}>
                {wk.volume > 0 && <span className="vol-bar" style={{ height: `${(wk.volume / maxVol) * 100}%`, animationDelay: `${i * 35}ms` }} />}
              </div>
            ))}
          </div>
          <div className="vol-x" aria-hidden>
            {weeks.map((wk, i) => (
              <span key={i} className={i === 7 ? 'now' : undefined}>{i === 7 ? 'This wk' : wk.start.toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric' })}</span>
            ))}
          </div>
          <p className="t-small muted" style={{ marginTop: 'var(--s-3)' }}>This week <b className="num" style={{ color: 'var(--chalk)' }}>{fmtVolume(weeks[7].volume, unit)} {unit}</b> across {weeks[7].sets} sets</p>
        </section>

        <section aria-labelledby="mus-h">
          <SectionHead id="mus-h" title="Sets per muscle" sub="Working sets in the last 7 days. 10–20 a week is the usual range for growth." />
          <div className="stack" style={{ gap: 6 }}>
            {muscles.length === 0 ? <p className="muted">Nothing logged this week yet.</p> : muscles.map(([m, n]) => (
              <div key={m} className="hbar">
                <span className="k">{m}</span>
                <span className="track"><span className={`fill${n >= 10 ? ' in-range' : ''}`} style={{ display: 'block', width: `${(n / maxMuscle) * 100}%` }} /></span>
                <span className="v num">{n}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="section" aria-labelledby="bw-h">
        <SectionHead id="bw-h" title="Body weight" />
        <form className="row" onSubmit={addBw} style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label className="field" style={{ width: 140 }}>
            <span>Weight ({unit})</span>
            <input className="input num" inputMode="decimal" value={bwInput} onChange={(e) => setBwInput(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={bw.length ? fmtNum(toDisplay(bw[bw.length - 1].weight_kg, unit), 1) : '0.0'} />
          </label>
          <label className="field" style={{ width: 170 }}>
            <span>Date</span>
            <input className="input" type="date" value={bwDate} max={new Date().toLocaleDateString('en-CA')} onChange={(e) => setBwDate(e.target.value)} />
          </label>
          <button className="btn primary" disabled={!bwInput}>Save weight</button>
        </form>
        {bw.length > 1 && (
          <div style={{ marginTop: 'var(--s-5)' }}>
            <LineChart points={bw.map((b) => ({ t: new Date(b.measured_on).getTime(), y: Number(b.weight_kg) }))} fmt={(v) => fmtNum(toDisplay(v, unit), 1)} color="var(--chalk-3)" highlightMax={false} height={180} />
          </div>
        )}
        {bw.length > 0 && (
          <details style={{ marginTop: 'var(--s-3)' }}>
            <summary className="btn ghost sm">All entries ({bw.length})</summary>
            <div className="list" style={{ marginTop: 8 }}>
              {[...bw].reverse().map((b) => (
                <div key={b.id} className="list-item" style={{ minHeight: 48 }}>
                  <span className="grow">{new Date(b.measured_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="num" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{fmtNum(toDisplay(b.weight_kg, unit), 1)} {unit}</span>
                  <button className="btn sm icon ghost" aria-label="Delete entry" onClick={async () => { await deleteBodyweight(b.id); setBw((x) => x.filter((y) => y.id !== b.id)); }}><Trash2 /></button>
                </div>
              ))}
            </div>
          </details>
        )}
      </section>

      <section className="section" aria-labelledby="hist-h">
        <SectionHead id="hist-h" title="History" />
        {recent.length === 0 ? <p className="muted">No finished workouts yet.</p> : (
          <div className="list">
            {recent.map((s) => {
              const done = s.sets.filter((x) => x.done && !x.is_warmup);
              const vol = done.reduce((a, x) => a + Number(x.weight_kg ?? 0) * (x.reps ?? 0), 0);
              const names = [...new Set(done.map((x) => exMap.get(x.exercise_id)?.name).filter(Boolean))];
              return (
                <Link key={s.id} to={`/history/${s.id}`} className="list-item">
                  <span className="grow">
                    <span className="row" style={{ gap: 10 }}>
                      <span className="title">{s.name}</span>
                      <span className="faint t-small">{relDate(s.started_at)}</span>
                    </span>
                    <span className="meta" style={{ textTransform: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {done.length} sets · {fmtVolume(vol, unit)} {unit} · {names.slice(0, 3).join(', ')}{names.length > 3 ? ` +${names.length - 3}` : ''}
                    </span>
                  </span>
                  <ArrowRight aria-hidden style={{ color: 'var(--chalk-3)', width: 18, flex: 'none' }} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

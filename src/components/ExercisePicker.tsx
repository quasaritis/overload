import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { getExercises, createCustomExercise } from '../lib/data';
import type { ExerciseLite, Track } from '../lib/types';
import { ErrorLine, Loading, Thumb, useDebounced } from './ui';
import { useApp } from '../lib/app';
import { humanError } from '../lib/supabase';
import { Sheet, type SheetHandle } from './Sheet';

export const MUSCLES = ['chest', 'shoulders', 'triceps', 'biceps', 'lats', 'middle back', 'lower back', 'traps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'forearms', 'adductors', 'abductors', 'neck'];
export const EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'kettlebells', 'bands', 'e-z curl bar', 'other'];

const STRENGTH_FIRST = new Set(['strength', 'powerlifting', 'olympic weightlifting', 'strongman']);

export function filterExercises(list: ExerciseLite[], q: string, muscle: string | null, equip: string | null) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const out = list.filter((e) => {
    if (muscle && !e.primary_muscles.includes(muscle)) return false;
    if (equip && e.equipment !== equip) return false;
    if (!words.length) return true;
    const hay = `${e.name} ${e.equipment ?? ''} ${e.primary_muscles.join(' ')}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  // Lifts people actually load first, then stretches & drills.
  return out.sort((a, b) => {
    const ca = a.created_by ? 0 : STRENGTH_FIRST.has(a.category) ? 1 : 2;
    const cb = b.created_by ? 0 : STRENGTH_FIRST.has(b.category) ? 1 : 2;
    if (ca !== cb) return ca - cb;
    if (words.length) {
      const sa = a.name.toLowerCase().startsWith(words[0]) ? 0 : 1;
      const sb = b.name.toLowerCase().startsWith(words[0]) ? 0 : 1;
      if (sa !== sb) return sa - sb;
    }
    return a.name.localeCompare(b.name);
  });
}

export function ExercisePicker({ onPick, onClose, title = 'Add exercise' }: { onPick: (e: ExerciseLite) => void; onClose: () => void; title?: string }) {
  const { user } = useApp();
  const [all, setAll] = useState<ExerciseLite[] | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const dq = useDebounced(q, 120);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheet = useRef<SheetHandle>(null);
  // Close with the slide-out, and hand the pick over straight away.
  const pick = (e: ExerciseLite) => {
    sheet.current?.close();
    onPick(e);
  };

  useEffect(() => {
    getExercises().then(setAll).catch((e) => setErr(humanError(e)));
  }, []);

  const results = useMemo(() => (all ? filterExercises(all, dq, muscle, null).slice(0, 120) : []), [all, dq, muscle]);

  const head = (
    <>
      <label className="field search-field">
        <span className="sr-only">Search exercises</span>
        <Search aria-hidden />
        <input
          ref={inputRef}
          className="input"
          placeholder="Search 900+ exercises, e.g. incline press"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </label>
      <div className="chips" role="group" aria-label="Filter by muscle">
        {MUSCLES.slice(0, 13).map((m) => (
          <button key={m} className="chip" aria-pressed={muscle === m} onClick={() => setMuscle(muscle === m ? null : m)}>
            {m}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <Sheet ref={sheet} title={title} onClose={onClose} head={head}>
          <ErrorLine>{err}</ErrorLine>
          {!all && !err && <Loading label="Loading exercises" />}
          {all && (
            <div className="list" style={{ borderTop: 0 }}>
              {results.map((e) => (
                <button key={e.id} className="list-item" onClick={() => pick(e)}>
                  <Thumb ex={e} size={48} />
                  <span className="grow">
                    <span className="title" style={{ display: 'block' }}>{e.name}</span>
                    <span className="meta">
                      {[e.primary_muscles[0], e.equipment].filter(Boolean).join(' · ')}
                      {e.created_by ? ' · yours' : ''}
                    </span>
                  </span>
                  <Plus aria-hidden style={{ color: 'var(--chalk-3)' }} />
                </button>
              ))}
              {results.length === 0 && (
                <div className="empty">
                  <h3>No match for “{q}”</h3>
                  <p className="muted">Check the spelling, clear the muscle filter, or add it as your own exercise.</p>
                </div>
              )}
              <div style={{ padding: '16px 0', border: 0 }}>
                {creating ? (
                  <CustomExerciseForm
                    initialName={q}
                    onCancel={() => setCreating(false)}
                    onCreate={async (input) => {
                      const ex = await createCustomExercise(user!.id, input);
                      pick(ex);
                    }}
                  />
                ) : (
                  <button className="btn" onClick={() => setCreating(true)}>
                    <Plus /> Create your own exercise
                  </button>
                )}
              </div>
            </div>
          )}
    </Sheet>
  );
}

function CustomExerciseForm({ initialName, onCreate, onCancel }: { initialName: string; onCreate: (i: { name: string; equipment: string | null; primary_muscles: string[]; track: Track }) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initialName);
  const [equipment, setEquipment] = useState('machine');
  const [muscle, setMuscle] = useState('chest');
  const [track, setTrack] = useState<Track>('weight_reps');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <form
      className="stack notice"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return setErr('Give the exercise a name.');
        setBusy(true);
        setErr('');
        try {
          await onCreate({ name: name.trim(), equipment, primary_muscles: [muscle], track });
        } catch (x) {
          setErr(humanError(x));
          setBusy(false);
        }
      }}
    >
      <h3 className="t-head" style={{ fontSize: '1.125rem' }}>New exercise</h3>
      <label className="field">
        <span>Name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
      </label>
      <div className="grid-2">
        <label className="field">
          <span>Equipment</span>
          <select className="select" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
            {EQUIPMENT.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Main muscle</span>
          <select className="select" value={muscle} onChange={(e) => setMuscle(e.target.value)}>
            {MUSCLES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Track it by</span>
        <select className="select" value={track} onChange={(e) => setTrack(e.target.value as Track)}>
          <option value="weight_reps">Weight × reps</option>
          <option value="bodyweight">Reps only (bodyweight)</option>
          <option value="time">Time held</option>
        </select>
      </label>
      <ErrorLine>{err}</ErrorLine>
      <div className="row">
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save and add'}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

import { useRef, useState } from 'react';
import { useApp } from '../../lib/app';
import { updateProfile } from '../../lib/data';
import { ACTIVITY, macroSplit, suggestTargets } from '../../lib/food';
import { humanError } from '../../lib/supabase';
import { fmtNum, fromDisplay, toDisplay } from '../../lib/units';
import type { Profile } from '../../lib/types';
import { ErrorLine, Seg } from '../ui';
import { Sheet, type SheetHandle } from '../Sheet';
import { kcalFmt } from './bits';

type Goal = NonNullable<Profile['diet_goal']>;
type Act = NonNullable<Profile['activity']>;

export function TargetsSheet({ onClose }: { onClose: () => void }) {
  const { user, profile, setProfile, unit, toast } = useApp();
  const p = profile!;
  const year = new Date().getFullYear();
  const [sex, setSex] = useState<'male' | 'female' | null>(p.sex);
  const [birth, setBirth] = useState(p.birth_year ? String(p.birth_year) : '');
  const [bw, setBw] = useState(p.bodyweight_kg ? fmtNum(toDisplay(p.bodyweight_kg, unit), 1) : '');
  const [height, setHeight] = useState(p.height_cm ? String(p.height_cm) : '');
  const [activity, setActivity] = useState<Act>(p.activity ?? 'light');
  const [goal, setGoal] = useState<Goal>(p.diet_goal ?? (p.goal === 'hypertrophy' ? 'bulk' : 'maintain'));
  const [kcal, setKcal] = useState(p.kcal_target ? String(p.kcal_target) : '');
  const [protein, setProtein] = useState(p.protein_target_g ? String(p.protein_target_g) : '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const sheet = useRef<SheetHandle>(null);

  const weightKg = bw ? fromDisplay(parseFloat(bw), unit) : null;
  const age = birth ? year - Number(birth) : null;
  const ready = sex && weightKg && height && age && age >= 12 && age <= 100;
  const s = ready ? suggestTargets({ sex: sex!, age: age!, weightKg: weightKg!, heightCm: Number(height), activity, goal }) : null;
  const kcalVal = Number(kcal) || s?.kcal || 0;
  const protVal = Number(protein) || s?.protein || 0;
  const split = kcalVal && protVal ? macroSplit(kcalVal, protVal) : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!kcalVal) return setErr('Fill in your details for a suggestion, or type a calorie target.');
    if (kcalVal < 800 || kcalVal > 8000) return setErr('Use a calorie target between 800 and 8,000.');
    setBusy(true);
    setErr('');
    try {
      const next = await updateProfile(user.id, {
        sex, activity, diet_goal: goal,
        birth_year: birth ? Number(birth) : null,
        bodyweight_kg: weightKg ? Math.round(weightKg * 10) / 10 : p.bodyweight_kg,
        height_cm: height ? Number(height) : p.height_cm,
        kcal_target: Math.round(kcalVal),
        protein_target_g: protVal ? Math.round(protVal) : null,
      });
      setProfile(next);
      toast('Targets saved');
      sheet.current?.close();
    } catch (x) {
      setErr(humanError(x));
      setBusy(false);
    }
  }

  return (
    <Sheet ref={sheet} title="Daily targets" onClose={onClose}>
      <form className="stack-lg" style={{ paddingTop: 'var(--s-4)' }} onSubmit={save}>
        <p className="muted t-small">Fill these in and Labour Chowk suggests a target. You can override it.</p>
        <div className="field">
          <span>Body</span>
          <Seg block label="Sex" value={sex} onChange={setSex} options={[['male', 'Male'], ['female', 'Female']] as const} />
          <span className="hint">Used only for the energy formula (Mifflin–St Jeor).</span>
        </div>
        <div className="grid-3">
          <label className="field">
            <span>Born in</span>
            <input className="input num" inputMode="numeric" placeholder="1999" value={birth} onChange={(e) => setBirth(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          </label>
          <label className="field">
            <span>Weight ({unit})</span>
            <input className="input num" inputMode="decimal" value={bw} onChange={(e) => setBw(e.target.value.replace(/[^0-9.]/g, ''))} />
          </label>
          <label className="field">
            <span>Height (cm)</span>
            <input className="input num" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value.replace(/[^0-9.]/g, ''))} />
          </label>
        </div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field-legend">How active are you?</legend>
          <div className="choice-list">
            {ACTIVITY.map((a) => (
              <label key={a.id} className="choice">
                <input type="radio" name="activity" checked={activity === a.id} onChange={() => setActivity(a.id)} />
                <span>{a.label}</span>
                {a.hint && <span className="faint t-small">{a.hint}</span>}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="field">
          <span>Goal</span>
          <Seg block label="Goal" value={goal} onChange={setGoal} options={[['cut', 'Lose fat'], ['maintain', 'Maintain'], ['bulk', 'Build muscle']] as const} />
        </div>

        {s && (
          <div className="notice t-small">
            You burn about <b className="num">{kcalFmt(s.tdee)}</b> kcal a day. {goal === 'cut' ? '20% under that' : goal === 'bulk' ? '10% over that' : 'Eating that much'} is{' '}
            <b className="num">{kcalFmt(s.kcal)}</b> kcal, with <b className="num">{s.protein} g</b> protein ({goal === 'cut' ? '2.0' : '1.8'} g per kg) to keep the gains coming.
          </div>
        )}

        <div className="grid-2">
          <label className="field">
            <span>Calories / day</span>
            <span className="set-cell">
              <input inputMode="numeric" placeholder={s ? String(s.kcal) : '2200'} value={kcal} onChange={(e) => setKcal(e.target.value.replace(/\D/g, ''))} />
              <span className="unit" aria-hidden>kcal</span>
            </span>
          </label>
          <label className="field">
            <span>Protein / day</span>
            <span className="set-cell">
              <input inputMode="numeric" placeholder={s ? String(s.protein) : '130'} value={protein} onChange={(e) => setProtein(e.target.value.replace(/\D/g, ''))} />
              <span className="unit" aria-hidden>g</span>
            </span>
          </label>
        </div>
        {split && <p className="faint t-small">That leaves roughly {split.carbs} g carbs and {split.fat} g fat.</p>}
        <ErrorLine>{err}</ErrorLine>
        <button className="btn primary lg block" disabled={busy}>{busy ? 'Saving…' : `Save ${kcalVal ? `${kcalFmt(kcalVal)} kcal` : 'targets'}`}</button>
      </form>
    </Sheet>
  );
}

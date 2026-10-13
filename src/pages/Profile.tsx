import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useApp } from '../lib/app';
import { updateProfile } from '../lib/data';
import { supabase, humanError } from '../lib/supabase';
import { fromDisplay, toDisplay, fmtNum } from '../lib/units';
import { ErrorLine } from '../components/ui';
import type { Profile, Unit } from '../lib/types';

export default function ProfilePage() {
  const { user, profile, setProfile, toast } = useApp();
  const p = profile!;
  const [name, setName] = useState(p.display_name ?? '');
  const [unit, setUnit] = useState<Unit>(p.unit);
  const [bw, setBw] = useState(p.bodyweight_kg ? fmtNum(toDisplay(p.bodyweight_kg, p.unit), 1) : '');
  const [height, setHeight] = useState(p.height_cm ? String(p.height_cm) : '');
  const [bar, setBar] = useState(fmtNum(toDisplay(p.bar_kg, p.unit), 1));
  const [experience, setExperience] = useState<Profile['experience']>(p.experience);
  const [goal, setGoal] = useState<Profile['goal']>(p.goal);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // When switching units, convert the visible numbers so nothing silently changes.
  function switchUnit(u: Unit) {
    if (u === unit) return;
    const conv = (s: string) => (s ? fmtNum(toDisplay(fromDisplay(parseFloat(s), unit), u), 1) : s);
    setBw(conv(bw));
    setBar(conv(bar));
    setUnit(u);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setErr('');
    try {
      const bwKg = bw ? fromDisplay(parseFloat(bw), unit) : null;
      const barKg = fromDisplay(parseFloat(bar || '20'), unit) ?? 20;
      const next = await updateProfile(user.id, {
        display_name: name.trim() || null,
        unit,
        bodyweight_kg: bwKg ? Math.round(bwKg * 10) / 10 : null,
        height_cm: height ? parseFloat(height) : null,
        bar_kg: Math.round(barKg * 10) / 10,
        experience,
        goal,
      });
      setProfile(next);
      toast('Profile saved');
    } catch (x) {
      setErr(humanError(x));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <header className="page-head">
        <div>
          <h1 className="t-title">{p.display_name || 'Your profile'}</h1>
          <p className="sub">{user?.email}</p>
        </div>
      </header>
      <form className="stack-lg" onSubmit={save}>
        <label className="field">
          <span>Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </label>
        <div className="field">
          <span>Units</span>
          <div className="seg block" role="group" aria-label="Units">
            <button type="button" aria-pressed={unit === 'kg'} onClick={() => switchUnit('kg')}>Kilograms</button>
            <button type="button" aria-pressed={unit === 'lb'} onClick={() => switchUnit('lb')}>Pounds</button>
          </div>
          <span className="hint">Everything is stored in kilograms and shown in your choice, so switching never changes your history.</span>
        </div>
        <div className="grid-2">
          <label className="field">
            <span>Body weight ({unit})</span>
            <input className="input num" inputMode="decimal" value={bw} onChange={(e) => setBw(e.target.value.replace(/[^0-9.]/g, ''))} />
          </label>
          <label className="field">
            <span>Height (cm)</span>
            <input className="input num" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value.replace(/[^0-9.]/g, ''))} />
          </label>
        </div>
        <label className="field">
          <span>Barbell weight ({unit})</span>
          <input className="input num" inputMode="decimal" value={bar} onChange={(e) => setBar(e.target.value.replace(/[^0-9.]/g, ''))} style={{ maxWidth: 200 }} />
          <span className="hint">Used for the plate-loading diagram. Standard Olympic bar: 20 kg / 45 lb.</span>
        </label>
        <div className="field">
          <span>Experience</span>
          <div className="seg block" role="group" aria-label="Experience">
            {(['new', 'intermediate', 'advanced'] as const).map((x) => (
              <button key={x} type="button" aria-pressed={experience === x} onClick={() => setExperience(x)}>{x === 'new' ? 'Under 1 yr' : x === 'intermediate' ? '1–3 yrs' : '3+ yrs'}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Goal</span>
          <div className="seg block" role="group" aria-label="Goal">
            {(['strength', 'hypertrophy', 'general'] as const).map((x) => (
              <button key={x} type="button" aria-pressed={goal === x} onClick={() => setGoal(x)}>{x === 'strength' ? 'Strength' : x === 'hypertrophy' ? 'Size' : 'Fitness'}</button>
            ))}
          </div>
        </div>
        <ErrorLine>{err}</ErrorLine>
        <button className="btn primary lg" disabled={busy} style={{ justifySelf: 'start' }}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>

      <div className="divider" style={{ marginTop: 'var(--s-7)' }} />
      <button className="btn" onClick={() => supabase.auth.signOut()}><LogOut /> Sign out</button>
    </div>
  );
}

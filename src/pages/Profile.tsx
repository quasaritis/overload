import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useApp } from '../lib/app';
import { updateProfile } from '../lib/data';
import { supabase, humanError } from '../lib/supabase';
import { fromDisplay, toDisplay, fmtNum } from '../lib/units';
import { ErrorLine, PageHead, Seg } from '../components/ui';
import { EXPERIENCE, GOALS, UNITS } from '../lib/labels';
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
      <PageHead title={p.display_name || 'Your profile'} sub={user?.email} />
      <form className="stack-lg" onSubmit={save}>
        <label className="field">
          <span>Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </label>
        <div className="field">
          <span>Units</span>
          <Seg block label="Units" value={unit} onChange={switchUnit} options={UNITS} />
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
          <Seg block label="Experience" value={experience} onChange={setExperience} options={EXPERIENCE} />
        </div>
        <div className="field">
          <span>Goal</span>
          <Seg block label="Goal" value={goal} onChange={setGoal} options={GOALS} />
        </div>
        <ErrorLine>{err}</ErrorLine>
        <button className="btn primary lg" disabled={busy} style={{ justifySelf: 'start' }}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>

      <div className="danger-zone">
        <button className="btn" onClick={() => supabase.auth.signOut()}><LogOut /> Sign out</button>
      </div>
    </div>
  );
}

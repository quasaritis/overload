import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useApp } from '../lib/app';
import { updateProfile, createPlanFromTemplate } from '../lib/data';
import { TEMPLATES } from '../lib/templates';
import { fromDisplay } from '../lib/units';
import { ErrorLine } from '../components/ui';
import { humanError } from '../lib/supabase';
import type { Profile, Unit } from '../lib/types';

export default function Welcome() {
  const { user, profile, setProfile } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.display_name ?? '');
  const [unit, setUnit] = useState<Unit>(profile?.unit ?? 'kg');
  const [bw, setBw] = useState('');
  const [height, setHeight] = useState('');
  const [experience, setExperience] = useState<Profile['experience']>('new');
  const [goal, setGoal] = useState<Profile['goal']>('strength');
  const [template, setTemplate] = useState<string | null>('fb3');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function finish() {
    if (!user) return;
    setBusy(true);
    setErr('');
    try {
      const bwKg = bw ? fromDisplay(parseFloat(bw), unit) : null;
      if (template) {
        const t = TEMPLATES.find((x) => x.key === template)!;
        await createPlanFromTemplate(t.name, t.plan, true);
      }
      const p = await updateProfile(user.id, {
        display_name: name.trim() || null,
        unit,
        bodyweight_kg: bwKg ? Math.round(bwKg * 10) / 10 : null,
        height_cm: height ? parseFloat(height) : null,
        experience,
        goal,
        bar_kg: unit === 'lb' ? 20.4 : 20,
        onboarded: true,
      });
      setProfile(p);
    } catch (x) {
      setErr(humanError(x));
      setBusy(false);
    }
  }

  return (
    <div className="main" style={{ maxWidth: 560, paddingBottom: 64 }}>
      <div className="row" style={{ gap: 6, marginBottom: 28 }} aria-label={`Step ${step + 1} of 3`}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= step ? 'var(--plate-15)' : 'var(--stage-3)', transition: 'background 300ms' }} />
        ))}
      </div>

      {step === 0 && (
        <form className="stack-lg" onSubmit={(e) => { e.preventDefault(); setStep(1); }}>
          <div className="stack">
            <h1 className="t-title">Set up your profile</h1>
            <p className="muted">This sets your units and plate maths. You can change any of it later.</p>
          </div>
          <label className="field">
            <span>Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="given-name" />
          </label>
          <div className="field">
            <span>You load the bar in</span>
            <div className="seg block" role="group" aria-label="Units">
              <button type="button" aria-pressed={unit === 'kg'} onClick={() => setUnit('kg')}>Kilograms</button>
              <button type="button" aria-pressed={unit === 'lb'} onClick={() => setUnit('lb')}>Pounds</button>
            </div>
          </div>
          <div className="grid-2">
            <label className="field">
              <span>Body weight ({unit})</span>
              <input className="input num" inputMode="decimal" value={bw} onChange={(e) => setBw(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Optional" />
            </label>
            <label className="field">
              <span>Height (cm)</span>
              <input className="input num" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Optional" />
            </label>
          </div>
          <button className="btn primary lg">Continue <ArrowRight /></button>
        </form>
      )}

      {step === 1 && (
        <div className="stack-lg">
          <h1 className="t-title">How do you train?</h1>
          <div className="field">
            <span>Time under the bar</span>
            <div className="seg block" role="group" aria-label="Experience">
              {(['new', 'intermediate', 'advanced'] as const).map((x) => (
                <button key={x} type="button" aria-pressed={experience === x} onClick={() => setExperience(x)}>
                  {x === 'new' ? 'Under 1 yr' : x === 'intermediate' ? '1–3 yrs' : '3+ yrs'}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>Main goal</span>
            <div className="seg block" role="group" aria-label="Goal">
              {(['strength', 'hypertrophy', 'general'] as const).map((x) => (
                <button key={x} type="button" aria-pressed={goal === x} onClick={() => setGoal(x)}>
                  {x === 'strength' ? 'Strength' : x === 'hypertrophy' ? 'Size' : 'Fitness'}
                </button>
              ))}
            </div>
          </div>
          <div className="row">
            <button className="btn primary lg" onClick={() => { setTemplate(experience === 'new' ? 'fb3' : goal === 'hypertrophy' ? 'ppl6' : 'ul4'); setStep(2); }}>
              Continue <ArrowRight />
            </button>
            <button className="btn ghost" onClick={() => setStep(0)}>Back</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="stack-lg">
          <div className="stack">
            <h1 className="t-title">Pick a starting plan</h1>
            <p className="muted">Each one uses double progression: hit the top of the rep range on every set, and the weight goes up next time. You can edit every exercise afterwards.</p>
          </div>
          <div className="list" role="radiogroup" aria-label="Starting plan">
            {TEMPLATES.map((t) => (
              <button key={t.key} role="radio" aria-checked={template === t.key} className="list-item" onClick={() => setTemplate(t.key)} style={{ alignItems: 'flex-start', padding: '18px 4px' }}>
                <span className="grow" style={{ display: 'grid', gap: 4 }}>
                  <span className="row" style={{ gap: 10 }}>
                    <span className="t-head">{t.name}</span>
                    <span className="tag">{t.days} days / wk</span>
                  </span>
                  <span className="muted t-small" style={{ whiteSpace: 'normal' }}>{t.blurb}</span>
                  <span className="faint t-small">{t.plan.map((d) => d.name).join(' · ')}</span>
                </span>
                <span className={`tick${template === t.key ? ' on' : ''}`} aria-hidden style={{ width: 36, height: 36, flex: 'none' }}>
                  {template === t.key && <Check />}
                </span>
              </button>
            ))}
            <button role="radio" aria-checked={template === null} className="list-item" onClick={() => setTemplate(null)}>
              <span className="grow">
                <span className="t-head" style={{ display: 'block' }}>Build my own</span>
                <span className="muted t-small">Start empty and add days and exercises yourself.</span>
              </span>
              <span className={`tick${template === null ? ' on' : ''}`} aria-hidden style={{ width: 36, height: 36, flex: 'none' }}>
                {template === null && <Check />}
              </span>
            </button>
          </div>
          <ErrorLine>{err}</ErrorLine>
          <div className="row">
            <button className="btn primary lg" onClick={finish} disabled={busy}>{busy ? 'Setting up…' : 'Start training'}</button>
            <button className="btn ghost" onClick={() => setStep(1)} disabled={busy}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

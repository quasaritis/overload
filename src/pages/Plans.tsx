import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { listPlans, createPlan, createPlanFromTemplate, setActivePlan } from '../lib/data';
import { TEMPLATES } from '../lib/templates';
import type { Plan } from '../lib/types';
import { ErrorLine, Loading, PageHead, SectionHead } from '../components/ui';
import { humanError } from '../lib/supabase';
import { useApp } from '../lib/app';

export default function Plans() {
  const nav = useNavigate();
  const { toast } = useApp();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [err, setErr] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => listPlans().then(setPlans).catch((e) => setErr(humanError(e)));
  useEffect(() => { load(); }, []);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setErr('');
    try { await fn(); } catch (x) { setErr(humanError(x)); } finally { setBusy(null); }
  }

  return (
    <div>
      <PageHead title="Plans" sub="The active plan decides what Today puts on the bar." />
      <ErrorLine>{err}</ErrorLine>

      {!plans ? <Loading /> : plans.length === 0 ? (
        <p className="muted">No plans yet. Start from a template below or build one from scratch.</p>
      ) : (
        <div className="list">
          {plans.map((p) => (
            <div key={p.id} className="list-item">
              <Link to={`/plans/${p.id}`} className="grow" style={{ textDecoration: 'none' }}>
                <span className="row" style={{ gap: 10 }}>
                  <span className="title">{p.name}</span>
                  {p.is_active && <span className="tag on">Active</span>}
                </span>
                <span className="meta" style={{ textTransform: 'none' }}>Created {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </Link>
              {!p.is_active && (
                <button className="btn sm" disabled={busy === p.id} onClick={() => run(p.id, async () => { await setActivePlan(p.id); await load(); toast(`${p.name} is now active`); })}>
                  Make active
                </button>
              )}
              <Link to={`/plans/${p.id}`} className="btn sm icon ghost" aria-label={`Edit ${p.name}`}><ArrowRight /></Link>
            </div>
          ))}
        </div>
      )}

      <section className="section">
        <SectionHead title="Start from a template" />
        <div className="list">
          {TEMPLATES.map((t) => (
            <div key={t.key} className="list-item" style={{ alignItems: 'flex-start', padding: '18px 4px' }}>
              <span className="grow" style={{ display: 'grid', gap: 4 }}>
                <span className="row" style={{ gap: 10 }}>
                  <span className="title">{t.name}</span>
                  <span className="tag">{t.days} days / wk</span>
                </span>
                <span className="muted t-small">{t.blurb}</span>
                <span className="faint t-small">{t.plan.map((d) => d.name).join(' · ')}</span>
              </span>
              <button className="btn sm" disabled={busy === t.key} onClick={() => run(t.key, async () => { const p = await createPlanFromTemplate(t.name, t.plan, true); nav(`/plans/${p.id}`); })}>
                {busy === t.key ? 'Adding…' : 'Use this'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead title="Build your own" />
        <form
          className="row"
          style={{ flexWrap: 'wrap' }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return setErr('Name the plan first.');
            run('new', async () => { const p = await createPlan(name.trim(), !plans?.some((x) => x.is_active)); nav(`/plans/${p.id}`); });
          }}
        >
          <label className="field" style={{ flex: '1 1 240px' }}>
            <span className="sr-only">Plan name</span>
            <input className="input" placeholder="Plan name, e.g. Bro split" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </label>
          <button className="btn primary" disabled={busy === 'new'}><Plus /> Create plan</button>
        </form>
      </section>
    </div>
  );
}

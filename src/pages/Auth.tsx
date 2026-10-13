import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { supabase, humanError } from '../lib/supabase';
import { Barbell, ErrorLine, Lights } from '../components/ui';
import { useApp } from '../lib/app';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setSent(`We sent a confirmation link to ${email}. Open it on this device to start lifting.`);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setSent(`If ${email} has an account, a reset link is on its way.`);
      }
    } catch (x) {
      setErr(humanError(x));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <style>{authCss}</style>
      <section className="auth-stage">
        <div className="auth-brand">
          <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden>
            <rect x="2" y="30" width="60" height="4" rx="1" fill="var(--chalk-2)" />
            <rect x="12" y="12" width="8" height="40" rx="2" fill="var(--plate-25)" />
            <rect x="21" y="17" width="6" height="30" rx="2" fill="var(--plate-20)" />
            <rect x="44" y="12" width="8" height="40" rx="2" fill="var(--plate-25)" />
            <rect x="37" y="17" width="6" height="30" rx="2" fill="var(--plate-20)" />
          </svg>
          Overload
        </div>
        <h1 className="t-display auth-h">Every session, a heavier attempt.</h1>
        <p className="auth-sub">
          Log your sets. Overload reads your last session and calls the next attempt — the weight, the reps, and the plates to load.
        </p>

        <div className="board auth-board" aria-label="Example of a next attempt">
          <div className="row between">
            <span className="lbl">Next attempt · Bench Press</span>
            <span className="tag">Example</span>
          </div>
          <div className="attempt num">
            82.5<span className="u">kg</span>
            <span className="x">×</span>8
          </div>
          <div className="row between" style={{ marginTop: 6, flexWrap: 'wrap', gap: 10 }}>
            <span className="verdict add">+2.5 kg</span>
            <span className="faint t-small">Last time 80 × 12, 12, 12</span>
          </div>
          <div style={{ marginTop: 18 }}>
            <Barbell totalKg={82.5} barKg={20} unit="kg" />
          </div>
          <div className="row" style={{ marginTop: 14, gap: 10 }}>
            <Lights count={3} on={3} />
            <span className="faint t-small">Three white lights: every set done</span>
          </div>
        </div>
      </section>

      <section className="auth-form-wrap">
        {sent ? (
          <div className="stack-lg auth-form">
            <MailCheck aria-hidden style={{ width: 36, height: 36, color: 'var(--plate-15)' }} />
            <h2 className="t-title">Check your inbox</h2>
            <p className="muted">{sent}</p>
            <button className="btn" onClick={() => { setSent(null); setMode('signin'); }}>Back to sign in</button>
          </div>
        ) : (
          <form className="stack-lg auth-form" onSubmit={submit} noValidate>
            {mode !== 'forgot' ? (
              <div className="seg block" role="group" aria-label="Account">
                <button type="button" aria-pressed={mode === 'signin'} onClick={() => { setMode('signin'); setErr(''); }}>Sign in</button>
                <button type="button" aria-pressed={mode === 'signup'} onClick={() => { setMode('signup'); setErr(''); }}>Create account</button>
              </div>
            ) : (
              <div className="stack">
                <h2 className="t-title">Reset password</h2>
                <p className="muted">Enter your email and we’ll send a link to set a new one.</p>
              </div>
            )}

            <div className="stack">
              {mode === 'signup' && (
                <label className="field">
                  <span>Your name</span>
                  <input className="input" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="What should we call you?" />
                </label>
              )}
              <label className="field">
                <span>Email</span>
                <input className="input" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </label>
              {mode !== 'forgot' && (
                <label className="field">
                  <span>Password</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
                  />
                </label>
              )}
            </div>

            <ErrorLine>{err}</ErrorLine>

            <button className="btn primary lg block" disabled={busy || !email || (mode !== 'forgot' && password.length < 6)}>
              {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </button>

            {mode === 'signin' && (
              <button type="button" className="btn ghost" onClick={() => { setMode('forgot'); setErr(''); }}>Forgot your password?</button>
            )}
            {mode === 'forgot' && (
              <button type="button" className="btn ghost" onClick={() => { setMode('signin'); setErr(''); }}>Back to sign in</button>
            )}
          </form>
        )}
      </section>
    </div>
  );
}

export function NewPassword() {
  const { clearRecovering, toast } = useApp();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="main" style={{ maxWidth: 440 }}>
      <form
        className="stack-lg"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr('');
          const { error } = await supabase.auth.updateUser({ password: pw });
          setBusy(false);
          if (error) return setErr(humanError(error));
          toast('Password updated');
          clearRecovering();
        }}
      >
        <h1 className="t-title">Set a new password</h1>
        <label className="field">
          <span>New password</span>
          <input className="input" type="password" autoComplete="new-password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required />
        </label>
        <ErrorLine>{err}</ErrorLine>
        <button className="btn primary lg" disabled={busy || pw.length < 6}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </div>
  );
}

const authCss = `
.auth { min-height: 100dvh; display: grid; grid-template-columns: 1fr; }
.auth-stage { padding: 28px 16px 8px; display: grid; align-content: start; gap: 18px; }
.auth-brand { display: flex; align-items: center; gap: 10px; font: 700 1.375rem/1 var(--font-num); text-transform: uppercase; letter-spacing: 0.03em; }
.auth-h { max-width: 11ch; margin-top: 12px; }
.auth-sub { color: var(--chalk-2); max-width: 44ch; font-size: 1.0625rem; }
.auth-board { margin-top: 6px; max-width: 520px; }
.auth-form-wrap { padding: 24px 16px 48px; display: grid; align-content: start; }
.auth-form { width: 100%; max-width: 420px; }
@media (min-width: 960px) {
  .auth { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
  .auth-stage { padding: 56px 64px; align-content: center; gap: 22px; background: var(--stage-0); border-right: 1px solid var(--rule); min-height: 100dvh; }
  .auth-h { font-size: clamp(3.5rem, 5.4vw, 5.5rem); }
  .auth-form-wrap { align-content: center; justify-items: center; padding: 48px; }
}
`;

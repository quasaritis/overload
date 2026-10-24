import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { supabase, humanError } from '../lib/supabase';
import { Barbell, Brandmark, ErrorLine, Lights, Seg } from '../components/ui';
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
        <Brandmark className="auth-brand" />
        <h1 className="t-display auth-h">Every session, a heavier attempt.</h1>
        <p className="auth-sub">
          Log your sets. Labour Chowk reads your last session and calls the next attempt: the weight, the reps and the plates to load.
        </p>

        <div className="board auth-board" aria-label="Example of a next attempt">
          <div className="row between">
            <span className="lbl">Next lift: bench press</span>
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
            <span className="faint t-small">Every set chalked off</span>
          </div>
        </div>
      </section>

      <section className="auth-form-wrap">
        {sent ? (
          <div className="stack-lg auth-form">
            <MailCheck aria-hidden style={{ width: 36, height: 36, color: 'var(--haldi)' }} />
            <h2 className="t-title">Check your inbox</h2>
            <p className="muted">{sent}</p>
            <button className="btn" onClick={() => { setSent(null); setMode('signin'); }}>Back to sign in</button>
          </div>
        ) : (
          <form className="stack-lg auth-form" onSubmit={submit} noValidate>
            {mode !== 'forgot' ? (
              <Seg block label="Account" value={mode} onChange={(m) => { setMode(m); setErr(''); }} options={[['signin', 'Sign in'], ['signup', 'Create account']] as const} />
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
.auth { min-height: 100dvh; display: grid; grid-template-columns: minmax(0, 1fr); }
.auth-stage { padding: 28px 16px 8px; display: grid; align-content: start; gap: 18px; }
.auth-brand .dev { font-size: 2.5rem; }
.auth-brand .lat { font-size: 0.75rem; }
.auth-h { max-width: 9ch; margin-top: 18px; }
.auth-sub { color: var(--chalk-2); max-width: 42ch; font-size: 1.0625rem; }
.auth-board { margin-top: 6px; max-width: 520px; }
.auth-form-wrap { padding: 24px 16px 48px; display: grid; align-content: start; }
.auth-form { width: 100%; max-width: 420px; }
@media (min-width: 960px) {
  .auth { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); }
  .auth-stage { padding: 56px 72px; align-content: center; gap: 24px; min-height: 100dvh; }
  .auth-brand .dev { font-size: 3.25rem; }
  .auth-h { font-size: clamp(4rem, 6vw, 6.25rem); }
  .auth-form-wrap { align-content: center; justify-items: center; padding: 48px; background: var(--stage-0); }
}
`;

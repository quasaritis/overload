import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getProfile } from './data';
import type { Profile, Unit } from './types';
import { fmtWeight } from './units';

interface AppCtx {
  user: User | null;
  profile: Profile | null;
  ready: boolean;
  recovering: boolean;
  unit: Unit;
  w: (kg: number | null | undefined) => string;
  refreshProfile: () => Promise<void>;
  setProfile: (p: Profile) => void;
  clearRecovering: () => void;
  toast: (msg: string) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; id: number; out: boolean } | null>(null);
  const showToast = useCallback((text: string) => setToastMsg({ text, id: Date.now(), out: false }), []);

  const load = useCallback(async (u: User | null) => {
    setUser(u);
    if (!u) {
      setProfile(null);
      setReady(true);
      return;
    }
    try {
      setProfile(await getProfile(u.id));
    } catch {
      setProfile(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') {
        // defer to avoid calling supabase inside the auth callback
        setTimeout(() => load(session?.user ?? null), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  // A toast stays 2.4 s, then drops away (faster than it came in) before it's removed.
  useEffect(() => {
    if (!toastMsg) return;
    const { id, out } = toastMsg;
    const t = setTimeout(() => setToastMsg((x) => (x?.id !== id ? x : out ? null : { ...x, out: true })), out ? 180 : 2400);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const unit: Unit = profile?.unit ?? 'kg';
  const value = useMemo<AppCtx>(
    () => ({
      user,
      profile,
      ready,
      recovering,
      unit,
      w: (kg) => fmtWeight(kg, unit),
      refreshProfile: async () => {
        if (user) setProfile(await getProfile(user.id));
      },
      setProfile,
      clearRecovering: () => setRecovering(false),
      toast: showToast,
    }),
    [user, profile, ready, recovering, unit, showToast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {toastMsg && (
        <div key={toastMsg.id} className={`toast${toastMsg.out ? ' out' : ''}`} role="status" aria-live="polite">
          {toastMsg.text}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

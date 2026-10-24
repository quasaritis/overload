import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configured = Boolean(url && key);

export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

/** Turn a Supabase/PostgREST error into a sentence a person can act on. */
export function humanError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/Invalid login credentials/i.test(msg)) return 'That email and password don’t match. Check both, or reset your password.';
  if (/Email not confirmed/i.test(msg)) return 'Confirm your email first. The link is in your inbox.';
  if (/User already registered/i.test(msg)) return 'There’s already an account with this email. Sign in instead.';
  if (/Password should be at least/i.test(msg)) return 'Use at least 6 characters for your password.';
  if (/rate limit/i.test(msg)) return 'Too many attempts in a short time. Wait a minute and try again.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Can’t reach the server. Check your connection and try again.';
  return msg;
}

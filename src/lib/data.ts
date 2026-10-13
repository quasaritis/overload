import { supabase } from './supabase';
import type { Exercise, ExerciseLite, Plan, PlanDay, PlanExercise, Session, SetRow, BodyMetric, Profile } from './types';

const LITE = 'id,name,category,equipment,level,mechanic,primary_muscles,secondary_muscles,images,track,created_by';

function check<T>(r: { data: T | null; error: unknown }): T {
  if (r.error) throw r.error;
  return r.data as T;
}

/* ---------- exercises (cached for the session) ---------- */
let exerciseCache: Promise<ExerciseLite[]> | null = null;
let exerciseMap: Map<string, ExerciseLite> | null = null;

export function getExercises(force = false): Promise<ExerciseLite[]> {
  if (exerciseCache && !force) return exerciseCache;
  const p: Promise<ExerciseLite[]> = Promise.resolve(
    supabase.from('exercises').select(LITE).order('name').range(0, 2999),
  ).then((r) => {
    const list = check(r) as ExerciseLite[];
    exerciseMap = new Map(list.map((e) => [e.id, e]));
    return list;
  });
  p.catch(() => { exerciseCache = null; });
  exerciseCache = p;
  return p;
}

export async function exerciseById(id: string): Promise<ExerciseLite | undefined> {
  if (!exerciseMap) await getExercises();
  return exerciseMap?.get(id);
}

export async function getExercise(id: string): Promise<Exercise> {
  return check(await supabase.from('exercises').select('*').eq('id', id).single()) as Exercise;
}

export async function createCustomExercise(userId: string, input: Pick<Exercise, 'name' | 'equipment' | 'primary_muscles' | 'track'>): Promise<ExerciseLite> {
  const id = `u_${crypto.randomUUID()}`;
  const row = check(
    await supabase
      .from('exercises')
      .insert({ id, created_by: userId, category: 'strength', ...input })
      .select(LITE)
      .single(),
  ) as ExerciseLite;
  await getExercises(true);
  return row;
}

/* ---------- profile ---------- */
export async function getProfile(userId: string): Promise<Profile | null> {
  const r = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return check(r) as Profile | null;
}

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
  return check(await supabase.from('profiles').update(patch).eq('id', userId).select('*').single()) as Profile;
}

/* ---------- plans ---------- */
export async function listPlans(): Promise<Plan[]> {
  return check(await supabase.from('plans').select('*').order('created_at', { ascending: false })) as Plan[];
}

export async function getPlan(id: string) {
  const plan = check(await supabase.from('plans').select('*').eq('id', id).single()) as Plan;
  const days = check(await supabase.from('plan_days').select('*').eq('plan_id', id).order('position')) as PlanDay[];
  const dayIds = days.map((d) => d.id);
  const exs = dayIds.length
    ? (check(await supabase.from('plan_exercises').select('*').in('plan_day_id', dayIds).order('position')) as PlanExercise[])
    : [];
  return { plan, days, exercises: exs };
}

export async function getActivePlan() {
  const r = check(await supabase.from('plans').select('id').eq('is_active', true).maybeSingle()) as { id: string } | null;
  return r ? getPlan(r.id) : null;
}

export async function setActivePlan(id: string) {
  check(await supabase.from('plans').update({ is_active: false }).eq('is_active', true));
  check(await supabase.from('plans').update({ is_active: true }).eq('id', id));
}

export async function createPlan(name: string, activate: boolean): Promise<Plan> {
  if (activate) check(await supabase.from('plans').update({ is_active: false }).eq('is_active', true));
  return check(await supabase.from('plans').insert({ name, is_active: activate }).select('*').single()) as Plan;
}

export interface TemplateDay { name: string; exercises: { id: string; sets: number; min: number; max: number; inc?: number; rest?: number }[] }

export async function createPlanFromTemplate(name: string, days: TemplateDay[], activate = true): Promise<Plan> {
  const plan = await createPlan(name, activate);
  const dayRows = check(
    await supabase.from('plan_days').insert(days.map((d, i) => ({ plan_id: plan.id, name: d.name, position: i }))).select('*'),
  ) as PlanDay[];
  const byPos = new Map(dayRows.map((d) => [d.position, d.id]));
  const exRows = days.flatMap((d, i) =>
    d.exercises.map((e, j) => ({
      plan_day_id: byPos.get(i)!,
      exercise_id: e.id,
      position: j,
      target_sets: e.sets,
      rep_min: e.min,
      rep_max: e.max,
      increment_kg: e.inc ?? 2.5,
      rest_seconds: e.rest ?? 120,
    })),
  );
  if (exRows.length) check(await supabase.from('plan_exercises').insert(exRows));
  return plan;
}

/** Which day of the plan comes next, based on the last finished session from this plan. */
export async function nextDay(days: PlanDay[]): Promise<PlanDay | null> {
  if (!days.length) return null;
  const ids = days.map((d) => d.id);
  const r = check(
    await supabase
      .from('sessions')
      .select('plan_day_id,started_at')
      .in('plan_day_id', ids)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(1),
  ) as { plan_day_id: string }[];
  if (!r.length) return days[0];
  const idx = days.findIndex((d) => d.id === r[0].plan_day_id);
  return days[(idx + 1) % days.length];
}

/* ---------- sessions & sets ---------- */
export async function openSession(): Promise<Session | null> {
  return check(
    await supabase.from('sessions').select('*').is('ended_at', null).order('started_at', { ascending: false }).limit(1).maybeSingle(),
  ) as Session | null;
}

export async function getSession(id: string): Promise<{ session: Session; sets: SetRow[] }> {
  const session = check(await supabase.from('sessions').select('*').eq('id', id).single()) as Session;
  const sets = check(
    await supabase.from('sets').select('*').eq('session_id', id).order('exercise_order').order('set_index'),
  ) as SetRow[];
  return { session, sets };
}

/**
 * Previous working sets for each exercise, grouped per session (newest first).
 * Excludes the session given in `excludeSession`.
 */
export async function historyFor(exerciseIds: string[], excludeSession?: string, sessionsBack = 4): Promise<Map<string, SetRow[][]>> {
  const out = new Map<string, SetRow[][]>();
  if (!exerciseIds.length) return out;
  let q = supabase
    .from('sets')
    .select('*, sessions!inner(ended_at,started_at)')
    .in('exercise_id', exerciseIds)
    .eq('done', true)
    .not('sessions.ended_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(600);
  if (excludeSession) q = q.neq('session_id', excludeSession);
  const rows = check(await q) as (SetRow & { sessions: { started_at: string } })[];
  for (const id of exerciseIds) {
    const mine = rows.filter((r) => r.exercise_id === id);
    const bySession = new Map<string, SetRow[]>();
    const order: string[] = [];
    for (const r of mine) {
      if (!bySession.has(r.session_id)) {
        bySession.set(r.session_id, []);
        order.push(r.session_id);
      }
      bySession.get(r.session_id)!.push(r);
    }
    out.set(
      id,
      order.slice(0, sessionsBack).map((sid) => bySession.get(sid)!.sort((a, b) => a.set_index - b.set_index)),
    );
  }
  return out;
}

export async function allSetsFor(exerciseId: string) {
  return check(
    await supabase
      .from('sets')
      .select('*, sessions!inner(started_at,ended_at)')
      .eq('exercise_id', exerciseId)
      .eq('done', true)
      .not('sessions.ended_at', 'is', null)
      .order('created_at', { ascending: true })
      .limit(5000),
  ) as (SetRow & { sessions: { started_at: string } })[];
}

export async function recentSessions(limit = 30) {
  return check(
    await supabase
      .from('sessions')
      .select('*, sets(weight_kg,reps,done,is_warmup,exercise_id)')
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(limit),
  ) as (Session & { sets: Pick<SetRow, 'weight_kg' | 'reps' | 'done' | 'is_warmup' | 'exercise_id'>[] })[];
}

export async function setsSince(iso: string) {
  return check(
    await supabase
      .from('sets')
      .select('weight_kg,reps,exercise_id,is_warmup,created_at, sessions!inner(started_at,ended_at)')
      .eq('done', true)
      .gte('sessions.started_at', iso)
      .not('sessions.ended_at', 'is', null)
      .limit(5000),
  ) as { weight_kg: number | null; reps: number | null; exercise_id: string; is_warmup: boolean; created_at: string; sessions: { started_at: string } }[];
}

export async function loggedExerciseIds(): Promise<{ id: string; count: number }[]> {
  const rows = check(
    await supabase.from('sets').select('exercise_id').eq('done', true).limit(10000),
  ) as { exercise_id: string }[];
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(r.exercise_id, (m.get(r.exercise_id) ?? 0) + 1));
  return [...m.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);
}

/* ---------- body weight ---------- */
export async function bodyMetrics(): Promise<BodyMetric[]> {
  return check(await supabase.from('body_metrics').select('*').order('measured_on', { ascending: true }).limit(1000)) as BodyMetric[];
}

export async function logBodyweight(date: string, kg: number) {
  check(await supabase.from('body_metrics').upsert({ measured_on: date, weight_kg: Math.round(kg * 10) / 10 }, { onConflict: 'user_id,measured_on' }));
}

export async function deleteBodyweight(id: string) {
  check(await supabase.from('body_metrics').delete().eq('id', id));
}

export { check };

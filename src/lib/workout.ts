import { supabase } from './supabase';
import { check, historyFor, exerciseById } from './data';
import { prescribe, type Target } from './progression';
import type { PlanDay, PlanExercise, Session } from './types';

export const DEFAULT_TARGET: Target = { target_sets: 3, rep_min: 8, rep_max: 12, increment_kg: 2.5 };

export async function startWorkout(day: PlanDay | null, exercises: PlanExercise[], fmt: (kg: number) => string): Promise<string> {
  const session = check(
    await supabase
      .from('sessions')
      .insert({ plan_day_id: day?.id ?? null, name: day?.name ?? 'Workout' })
      .select('*')
      .single(),
  ) as Session;

  if (exercises.length) {
    const hist = await historyFor(exercises.map((e) => e.exercise_id), session.id);
    const rows: Record<string, unknown>[] = [];
    for (const [i, pe] of exercises.entries()) {
      const ex = await exerciseById(pe.exercise_id);
      const track = ex?.track ?? 'weight_reps';
      const p = prescribe(hist.get(pe.exercise_id) ?? [], pe, track, fmt);
      for (let j = 0; j < pe.target_sets; j++) {
        rows.push({
          session_id: session.id,
          exercise_id: pe.exercise_id,
          exercise_order: i,
          set_index: j,
          weight_kg: track === 'weight_reps' ? p.weightKg : null,
          reps: track === 'time' ? null : p.reps,
          duration_s: track === 'time' ? p.durationS ?? 30 : null,
          done: false,
        });
      }
    }
    if (rows.length) check(await supabase.from('sets').insert(rows));
  }
  return session.id;
}

// Seeds/updates the shared exercise library from free-exercise-db.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-exercises.mjs
import { createClient } from '@supabase/supabase-js';

const SRC = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const trackFor = (e) => {
  if (e.category === 'stretching') return 'time';
  if (e.category === 'cardio') return 'cardio';
  if (e.equipment === 'body only' || e.equipment === null) return 'bodyweight';
  return 'weight_reps';
};

const list = await (await fetch(SRC)).json();
const rows = list.map((e) => ({
  id: e.id, name: e.name, category: e.category, equipment: e.equipment, level: e.level,
  force: e.force, mechanic: e.mechanic, primary_muscles: e.primaryMuscles, secondary_muscles: e.secondaryMuscles,
  instructions: e.instructions, images: e.images, track: trackFor(e),
}));
for (let i = 0; i < rows.length; i += 200) {
  const { error } = await db.from('exercises').upsert(rows.slice(i, i + 200));
  if (error) throw error;
}
console.log(`Upserted ${rows.length} exercises`);

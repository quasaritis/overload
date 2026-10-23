# Database

Migrations applied to the Supabase project `overload` (ref `tqlfzbbdderhifhaomai`).

- `20261013202851_core_schema.sql` — tables, row-level security, sign-up trigger.
- `20261023180755_food_tracking.sql` — food log, saved meals, calorie/protein targets on profiles, scan counter,
  private `meal-photos` storage bucket (one folder per user).
- Edge function `functions/analyze-meal` — meal photo → itemised estimate (see the main README for secrets).
- Exercise library: 876 exercises from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain)
  plus 28 common gym movements it lacks (machine laterals, pec deck, belt squat, etc.). Re-seed with
  `node scripts/seed-exercises.mjs` (needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`).

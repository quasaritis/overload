# Overload

A training log built around progressive overload. Log your sets; Overload reads your last session and
calls the **next attempt** — weight, reps, and the plates to load on each side of the bar.

## What it does

- **Accounts & profiles** — email/password sign-in (Supabase Auth), units (kg/lb), body weight, bar weight, goal.
- **Plans** — build your own split or start from Full Body ×3, Upper/Lower, or Push/Pull/Legs. Each exercise has
  sets, a rep range, a load increment and rest time.
- **Live workout logger** — sets saved as you tick them, warm-up sets, rest timer, add/remove exercises mid-session,
  resume an unfinished workout from any device.
- **Double progression** — hit the top of the rep range on every set → add the increment next time. Miss the bottom
  of the range twice at the same weight → drop 10% and rebuild. Otherwise, same weight, chase one more rep.
- **904 exercises** with muscles, equipment and step-by-step cues (free-exercise-db, public domain, plus common
  gym machines it lacks). Add your own.
- **Progress** — estimated 1RM per lift (Epley), rep maxes, weekly volume, sets per muscle, body-weight log,
  full session history, personal records at the end of each workout.

## Stack

Vite + React + TypeScript · Supabase (Postgres, Auth, row-level security) · deployed on Vercel.

## Run locally

```bash
cp .env.example .env.local   # fill in your Supabase URL and publishable key
npm install
npm run dev
```

Database schema lives in `supabase/migrations`.

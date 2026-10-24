# Labour Chowk

A training log built around progressive overload. Log your sets; Labour Chowk reads your last session and
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
- **Food** — a calorie and protein log built for Indian food:
  - **Indian meals:** 190+ standard dishes (dal tadka, rajma, idli, biryani, chole bhature, thalis…) in the portions people
    actually eat — 1 katori (150 g), 1 roti, 1 plate. Each dish is a per-serving recipe computed from IFCT 2017 ingredient
    values, so you can open it, see what's in it and change the ingredients to match how you cook.
  - **Photo:** snap the plate; an AI vision model lists each item with an estimated weight, matched to the standard
    dishes where it can. Adjust grams before saving.
  - **Ingredients:** build a meal from 180+ raw ingredients (IFCT 2017 + USDA), set servings, save it to My meals.
  - **Quick add** from a packet label, recent foods in one tap, daily calorie/protein targets suggested from your body
    and goal (Mifflin–St Jeor; 1.8–2.0 g protein per kg), a 7-day strip.
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

### Food data

`src/data/food.json` is generated — edit the sources and rebuild:

```bash
node scripts/build-food.mjs            # add --table to print every dish
```

- `scripts/food/ifct.json` — 140 ingredients from the Indian Food Composition Tables 2017 (ICMR-NIN), extracted with
  `scripts/food/extract-ifct.py` from [nodef/ifct2017](https://github.com/nodef/ifct2017).
- `scripts/food/extras.json` — foods IFCT lacks (curd, bread, oats, whey, soya chunks…), mostly USDA FoodData Central.
- `scripts/food/dishes.mjs` — the standard Indian meals, one serving each, as raw ingredient grams.

Energy is always computed as 4 kcal/g protein and available carbs, 9 kcal/g fat, 2 kcal/g fibre.

### Photo scanning

The `analyze-meal` edge function sends the photo to a vision model. Set one key:

```bash
supabase secrets set GEMINI_API_KEY=...        # free tier; tries gemini-3.8-flash, then 3.5-flash, then flash-latest
# or
supabase secrets set ANTHROPIC_API_KEY=...     # model: ANTHROPIC_MODEL (default claude-haiku-5-5)
supabase functions deploy analyze-meal
```

Each user gets `SCAN_DAILY_LIMIT` scans per 24 h (default 40). Without a key the rest of the food log works and the
Photo tab explains it isn't set up.

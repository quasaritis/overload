-- FOOD TRACKING: daily food log, saved meals, calorie/protein targets, meal photos.

-- Targets and the inputs used to suggest them
alter table public.profiles
  add column sex text check (sex in ('male','female')),
  add column birth_year int check (birth_year between 1920 and 2015),
  add column activity text check (activity in ('sedentary','light','moderate','very','athlete')),
  add column diet_goal text check (diet_goal in ('cut','maintain','bulk')),
  add column kcal_target int check (kcal_target between 800 and 8000),
  add column protein_target_g int check (protein_target_g between 20 and 500);

-- One row per thing eaten. Nutrition is stored as eaten (already multiplied by qty), so the log never
-- changes if the food library is updated later.
create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  eaten_on date not null default current_date,
  meal text not null check (meal in ('breakfast','lunch','snack','dinner')),
  name text not null check (char_length(name) between 1 and 160),
  source text not null check (source in ('dish','ingredient','recipe','photo','quick','saved')),
  ref_id text check (char_length(ref_id) <= 80),
  qty numeric(6,2) not null default 1 check (qty > 0 and qty <= 100),
  unit text check (char_length(unit) <= 60),
  grams numeric(7,1) check (grams is null or grams between 0 and 20000),
  kcal numeric(7,1) not null check (kcal between 0 and 20000),
  protein_g numeric(6,1) not null default 0 check (protein_g between 0 and 2000),
  carbs_g numeric(6,1) not null default 0 check (carbs_g between 0 and 3000),
  fat_g numeric(6,1) not null default 0 check (fat_g between 0 and 2000),
  fibre_g numeric(6,1) not null default 0 check (fibre_g between 0 and 1000),
  items jsonb check (items is null or jsonb_typeof(items) = 'array'),
  photo_path text check (char_length(photo_path) <= 200),
  created_at timestamptz not null default now()
);
create index food_entries_user_day_idx on public.food_entries (user_id, eaten_on desc, created_at);
create index food_entries_user_ref_idx on public.food_entries (user_id, ref_id, created_at desc);

-- "My meals": a user's own recipes / regular plates, stored per serving.
create table public.saved_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  unit text not null default 'serving' check (char_length(unit) <= 60),
  grams numeric(7,1) check (grams is null or grams between 0 and 20000),
  kcal numeric(7,1) not null check (kcal between 0 and 20000),
  protein_g numeric(6,1) not null default 0,
  carbs_g numeric(6,1) not null default 0,
  fat_g numeric(6,1) not null default 0,
  fibre_g numeric(6,1) not null default 0,
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array'),
  created_at timestamptz not null default now()
);
create index saved_meals_user_idx on public.saved_meals (user_id, created_at desc);

-- One row per photo analysis, so the edge function can cap AI calls per user per day.
create table public.food_scans (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index food_scans_user_idx on public.food_scans (user_id, created_at desc);

alter table public.food_entries enable row level security;
alter table public.saved_meals enable row level security;
alter table public.food_scans enable row level security;

create policy "own food entries" on public.food_entries for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own saved meals" on public.saved_meals for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- scans: users may read and add their own, never edit or delete (that would reset the daily cap)
create policy "read own scans" on public.food_scans for select to authenticated
  using (user_id = (select auth.uid()));
create policy "add own scans" on public.food_scans for insert to authenticated
  with check (user_id = (select auth.uid()));

revoke all on public.food_entries, public.saved_meals, public.food_scans from anon;
grant select, insert, update, delete on public.food_entries, public.saved_meals to authenticated;
grant select, insert on public.food_scans to authenticated;

-- Meal photos: private bucket, one folder per user (<uid>/<file>.jpg)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 1048576, array['image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "read own meal photos" on storage.objects for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "upload own meal photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "delete own meal photos" on storage.objects for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

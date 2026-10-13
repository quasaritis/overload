create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  unit text not null default 'kg' check (unit in ('kg','lb')),
  bodyweight_kg numeric(5,1) check (bodyweight_kg is null or bodyweight_kg between 20 and 400),
  height_cm numeric(4,1) check (height_cm is null or height_cm between 100 and 250),
  experience text check (experience in ('new','intermediate','advanced')),
  goal text check (goal in ('strength','hypertrophy','general')),
  bar_kg numeric(4,1) not null default 20,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data->>'display_name',''));
  return new;
end $$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

-- EXERCISES (shared library + user custom)
create table public.exercises (
  id text primary key,
  name text not null check (char_length(name) between 1 and 120),
  category text not null default 'strength',
  equipment text,
  level text,
  force text,
  mechanic text,
  primary_muscles text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  instructions text[] not null default '{}',
  images text[] not null default '{}',
  track text not null default 'weight_reps' check (track in ('weight_reps','bodyweight','time','cardio')),
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index exercises_created_by_idx on public.exercises (created_by);

-- PLANS
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  notes text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
create index plans_user_id_idx on public.plans (user_id);
create unique index plans_one_active_per_user on public.plans (user_id) where is_active;

create table public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index plan_days_plan_id_idx on public.plan_days (plan_id, position);
create index plan_days_user_id_idx on public.plan_days (user_id);

create table public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.plan_days(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete cascade,
  position int not null default 0,
  target_sets int not null default 3 check (target_sets between 1 and 12),
  rep_min int not null default 8 check (rep_min between 1 and 100),
  rep_max int not null default 12 check (rep_max between 1 and 100),
  increment_kg numeric(5,2) not null default 2.5 check (increment_kg >= 0 and increment_kg <= 50),
  rest_seconds int not null default 120 check (rest_seconds between 0 and 900),
  notes text,
  check (rep_max >= rep_min)
);
create index plan_exercises_day_idx on public.plan_exercises (plan_day_id, position);
create index plan_exercises_user_id_idx on public.plan_exercises (user_id);
create index plan_exercises_exercise_idx on public.plan_exercises (exercise_id);

-- SESSIONS & SETS
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_day_id uuid references public.plan_days(id) on delete set null,
  name text not null default 'Workout' check (char_length(name) <= 80),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index sessions_user_started_idx on public.sessions (user_id, started_at desc);
create index sessions_plan_day_idx on public.sessions (plan_day_id);

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete cascade,
  exercise_order int not null default 0,
  set_index int not null default 0,
  weight_kg numeric(6,2) check (weight_kg is null or weight_kg between 0 and 1000),
  reps int check (reps is null or reps between 0 and 500),
  duration_s int check (duration_s is null or duration_s between 0 and 86400),
  distance_m numeric(8,1) check (distance_m is null or distance_m >= 0),
  rpe numeric(3,1) check (rpe is null or rpe between 1 and 10),
  is_warmup boolean not null default false,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index sets_session_idx on public.sets (session_id, exercise_order, set_index);
create index sets_user_exercise_idx on public.sets (user_id, exercise_id, created_at desc);
create index sets_exercise_idx on public.sets (exercise_id);

-- BODY WEIGHT LOG
create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  measured_on date not null default current_date,
  weight_kg numeric(5,1) not null check (weight_kg between 20 and 400),
  unique (user_id, measured_on)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.sessions enable row level security;
alter table public.sets enable row level security;
alter table public.body_metrics enable row level security;

create policy "own profile read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "library and own exercises" on public.exercises for select to authenticated
  using (created_by is null or created_by = (select auth.uid()));
create policy "create own exercises" on public.exercises for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "update own exercises" on public.exercises for update to authenticated
  using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
create policy "delete own exercises" on public.exercises for delete to authenticated
  using (created_by = (select auth.uid()));

create policy "own plans" on public.plans for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own plan days" on public.plan_days for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from public.plans p where p.id = plan_id and p.user_id = (select auth.uid())));

create policy "own plan exercises" on public.plan_exercises for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from public.plan_days d where d.id = plan_day_id and d.user_id = (select auth.uid())));

create policy "own sessions" on public.sessions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (plan_day_id is null or exists (select 1 from public.plan_days d where d.id = plan_day_id and d.user_id = (select auth.uid()))));

create policy "own sets" on public.sets for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from public.sessions s where s.id = session_id and s.user_id = (select auth.uid())));

create policy "own body metrics" on public.body_metrics for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- privileges: nothing for anon
revoke all on all tables in schema public from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.exercises, public.plans, public.plan_days, public.plan_exercises, public.sessions, public.sets, public.body_metrics to authenticated;

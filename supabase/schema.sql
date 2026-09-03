-- Run this once in Supabase Dashboard -> SQL Editor.
-- The browser only uses the publishable/anon key. RLS protects each user's row.

create table if not exists public.progress_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  history jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress_snapshots enable row level security;

drop policy if exists "Users can read their own progress" on public.progress_snapshots;
create policy "Users can read their own progress"
  on public.progress_snapshots
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own progress" on public.progress_snapshots;
create policy "Users can create their own progress"
  on public.progress_snapshots
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own progress" on public.progress_snapshots;
create policy "Users can update their own progress"
  on public.progress_snapshots
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anonymous visit analytics are written and read only by the Edge Function's
-- service-role client. No browser-facing RLS policy is intentionally created.
create table if not exists public.visit_sessions (
  session_id uuid primary key,
  visitor_id text not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  device_type text,
  browser text,
  os text,
  screen text,
  page_path text,
  ip_address text,
  user_agent text
);

alter table public.visit_sessions enable row level security;

create index if not exists visit_sessions_last_seen_idx
  on public.visit_sessions (last_seen_at desc);

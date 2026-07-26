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

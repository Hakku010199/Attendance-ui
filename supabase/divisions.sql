-- Run this in Supabase SQL Editor (once) so divisions persist in the database
-- instead of disappearing on refresh.
create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.divisions enable row level security;

-- Allow anyone with the anon/publishable key to read + add divisions.
-- Tighten these policies later if you add auth (e.g. `auth.uid() is not null`).
drop policy if exists "divisions_select_all" on public.divisions;
create policy "divisions_select_all"
  on public.divisions for select
  using (true);

drop policy if exists "divisions_insert_all" on public.divisions;
create policy "divisions_insert_all"
  on public.divisions for insert
  with check (true);

-- Seed the original three divisions (ignored if they already exist)
insert into public.divisions (name) values
  ('Division A'),
  ('Division B'),
  ('Division C')
on conflict (name) do nothing;
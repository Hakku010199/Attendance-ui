-- attendance-ui per-center scoping.
-- Run ONCE in Supabase SQL Editor. Requires the center-portal schema:
--   public.centers (id), public.center_members (user_id, center_id).
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- 1) Ensure center_id exists on divisions + students (multi-tenant key).
alter table public.divisions
  add column if not exists center_id uuid references public.centers(id) on delete cascade;
alter table public.students
  add column if not exists center_id uuid references public.centers(id) on delete cascade;

-- Helpful indexes for the per-center dropdown + roster queries.
create index if not exists divisions_center_id_idx on public.divisions (center_id);
create index if not exists students_center_id_idx on public.students (center_id);
create index if not exists students_division_center_idx
  on public.students (division_id, center_id);

-- 2) RLS: a signed-in user may touch ONLY rows of their own center.
-- Membership lookup: center_members(user_id = auth.uid()) -> center_id.
alter table public.divisions enable row level security;
alter table public.students enable row level security;

drop policy if exists "divisions_own_center_select" on public.divisions;
create policy "divisions_own_center_select"
  on public.divisions for select
  to authenticated
  using (
    center_id in (
      select center_id from public.center_members where user_id = auth.uid()
    )
  );

drop policy if exists "divisions_own_center_insert" on public.divisions;
create policy "divisions_own_center_insert"
  on public.divisions for insert
  to authenticated
  with check (
    center_id in (
      select center_id from public.center_members where user_id = auth.uid()
    )
  );

drop policy if exists "divisions_own_center_update" on public.divisions;
create policy "divisions_own_center_update"
  on public.divisions for update
  to authenticated
  using (
    center_id in (
      select center_id from public.center_members where user_id = auth.uid()
    )
  )
  with check (
    center_id in (
      select center_id from public.center_members where user_id = auth.uid()
    )
  );

drop policy if exists "divisions_own_center_delete" on public.divisions;
create policy "divisions_own_center_delete"
  on public.divisions for delete
  to authenticated
  using (
    center_id in (
      select center_id from public.center_members where user_id = auth.uid()
    )
  );

drop policy if exists "students_own_center_select" on public.students;
create policy "students_own_center_select"
  on public.students for select
  to authenticated
  using (
    center_id in (
      select center_id from public.center_members where user_id = auth.uid()
    )
  );

drop policy if exists "students_own_center_insert" on public.students;
create policy "students_own_center_insert"
  on public.students for insert
  to authenticated
  with check (
    center_id in (
      select center_id from public.center_members where user_id = auth.uid()
    )
  );

drop policy if exists "students_own_center_update" on public.students;
create policy "students_own_center_update"
  on public.students for update
  to authenticated
  using (
    center_id in (
      select center_id from public.center_members where user_id = auth.uid()
    )
  )
  with check (
    center_id in (
      select center_id from public.center_members where user_id = auth.uid()
    )
  );

drop policy if exists "students_own_center_delete" on public.students;
create policy "students_own_center_delete"
  on public.students for delete
  to authenticated
  using (
    center_id in (
      select center_id from public.center_members where user_id = auth.uid()
    )
  );

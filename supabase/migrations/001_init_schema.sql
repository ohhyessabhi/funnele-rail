-- =============================================================================
-- Funnele PM — initial schema, RLS, and realtime
-- Run this in Supabase -> SQL Editor -> New Query -> Run.
--
-- Design notes:
--  * members.id == auth.users.id (a member row shares its auth user's id).
--  * RLS uses SECURITY DEFINER helper functions so policies never query the
--    members table directly from within a members-scoped context (which would
--    cause Postgres "infinite recursion detected in policy" errors).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tables (ordered so foreign-key targets exist first)
-- ---------------------------------------------------------------------------

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists members (
  id uuid primary key,                    -- equals auth.users.id
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text check (role in ('Admin','PM','SEO','Web Designer','Web Developer','Email Marketing','Google Ads','Meta Ads')),
  avatar_url text,
  status text check (status in ('Active','Inactive')) default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  state text check (state in ('Active','Paused','Cancelled')) default 'Active',
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  notes text,
  status text check (status in ('Backlog','Ready','In Progress','Client Review','Approved','Completed','Revision Required')) default 'Backlog',
  priority text check (priority in ('Low','Normal','High','Urgent')) default 'Normal',
  assignee_id uuid references members(id) on delete set null,
  due_date date,
  source text check (source in ('Manual','Teamwork','Fireflies')) default 'Manual',
  source_ref text,
  status_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  author_id uuid references members(id) on delete set null,
  body text not null,
  auto boolean default false,
  created_at timestamptz default now()
);

create table if not exists time_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  minutes int not null,
  logged_at date,
  created_at timestamptz default now()
);

create table if not exists deliverables (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  url text,
  note text,
  created_at timestamptz default now()
);

create table if not exists inbox (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  source text check (source in ('Teamwork','Fireflies')) not null,
  title text not null,
  detail text,
  project_id uuid references projects(id) on delete set null,
  confidence text check (confidence in ('high','medium','low')) default 'medium',
  evidence text,
  created_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_members_org on members(org_id);
create index if not exists idx_projects_org on projects(org_id);
create index if not exists idx_tasks_org on tasks(org_id);
create index if not exists idx_tasks_assignee on tasks(assignee_id);
create index if not exists idx_comments_task on comments(task_id);
create index if not exists idx_inbox_org on inbox(org_id);

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER helpers (bypass RLS -> no recursion)
-- ---------------------------------------------------------------------------

create or replace function public.current_org_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select org_id from members where id = auth.uid();
$$;

create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from members where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role from members where id = auth.uid()) = 'Admin', false);
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table organizations enable row level security;
alter table members enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table time_logs enable row level security;
alter table deliverables enable row level security;
alter table inbox enable row level security;

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------
drop policy if exists organizations_select on organizations;
create policy organizations_select on organizations for select
  using (id = public.current_org_id() or owner_id = auth.uid());

drop policy if exists organizations_insert on organizations;
create policy organizations_insert on organizations for insert
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------
drop policy if exists members_select on members;
create policy members_select on members for select
  using (id = auth.uid() or org_id = public.current_org_id());

-- Self-provision on sign-up, OR an admin adding a member to their org.
drop policy if exists members_insert on members;
create policy members_insert on members for insert
  with check (
    id = auth.uid()
    or (public.is_admin() and org_id = public.current_org_id())
  );

drop policy if exists members_update on members;
create policy members_update on members for update
  using (
    id = auth.uid()
    or (public.is_admin() and org_id = public.current_org_id())
  );

-- ---------------------------------------------------------------------------
-- Projects (everyone in org can read; only admins write)
-- ---------------------------------------------------------------------------
drop policy if exists projects_select on projects;
create policy projects_select on projects for select
  using (org_id = public.current_org_id());

drop policy if exists projects_write on projects;
create policy projects_write on projects for all
  using (public.is_admin() and org_id = public.current_org_id())
  with check (public.is_admin() and org_id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- Tasks (admins see all in org; members see only their assigned tasks)
-- ---------------------------------------------------------------------------
drop policy if exists tasks_select on tasks;
create policy tasks_select on tasks for select
  using (
    org_id = public.current_org_id()
    and (public.is_admin() or assignee_id = auth.uid())
  );

drop policy if exists tasks_insert on tasks;
create policy tasks_insert on tasks for insert
  with check (
    org_id = public.current_org_id()
    and (public.is_admin() or assignee_id = auth.uid())
  );

-- Admins can update any org task; assignees can update their own.
drop policy if exists tasks_update on tasks;
create policy tasks_update on tasks for update
  using (
    org_id = public.current_org_id()
    and (public.is_admin() or assignee_id = auth.uid())
  )
  with check (org_id = public.current_org_id());

drop policy if exists tasks_delete on tasks;
create policy tasks_delete on tasks for delete
  using (public.is_admin() and org_id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- Comments (readable/writable when the parent task is visible to the user)
-- ---------------------------------------------------------------------------
drop policy if exists comments_select on comments;
create policy comments_select on comments for select
  using (
    task_id in (
      select id from tasks
      where org_id = public.current_org_id()
        and (public.is_admin() or assignee_id = auth.uid())
    )
  );

drop policy if exists comments_insert on comments;
create policy comments_insert on comments for insert
  with check (
    author_id = auth.uid()
    and task_id in (
      select id from tasks
      where org_id = public.current_org_id()
        and (public.is_admin() or assignee_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Time logs (scoped to visible tasks; members log their own time)
-- ---------------------------------------------------------------------------
drop policy if exists time_logs_select on time_logs;
create policy time_logs_select on time_logs for select
  using (
    task_id in (
      select id from tasks
      where org_id = public.current_org_id()
        and (public.is_admin() or assignee_id = auth.uid())
    )
  );

drop policy if exists time_logs_insert on time_logs;
create policy time_logs_insert on time_logs for insert
  with check (
    member_id = auth.uid()
    and task_id in (
      select id from tasks
      where org_id = public.current_org_id()
        and (public.is_admin() or assignee_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Deliverables (scoped to visible tasks)
-- ---------------------------------------------------------------------------
drop policy if exists deliverables_select on deliverables;
create policy deliverables_select on deliverables for select
  using (
    task_id in (
      select id from tasks
      where org_id = public.current_org_id()
        and (public.is_admin() or assignee_id = auth.uid())
    )
  );

drop policy if exists deliverables_write on deliverables;
create policy deliverables_write on deliverables for all
  using (
    task_id in (
      select id from tasks
      where org_id = public.current_org_id()
        and (public.is_admin() or assignee_id = auth.uid())
    )
  )
  with check (
    task_id in (
      select id from tasks
      where org_id = public.current_org_id()
        and (public.is_admin() or assignee_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Inbox (admin-only intake review)
-- ---------------------------------------------------------------------------
drop policy if exists inbox_all on inbox;
create policy inbox_all on inbox for all
  using (public.is_admin() and org_id = public.current_org_id())
  with check (public.is_admin() and org_id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- Realtime: publish the tables the app subscribes to
-- ---------------------------------------------------------------------------
do $$
begin
  begin execute 'alter publication supabase_realtime add table tasks'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table comments'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table projects'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table members'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table inbox'; exception when others then null; end;
end $$;

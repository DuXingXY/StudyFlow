-- =============================================================================
-- StudyFlow · 学程 —— 大学生学习与项目管理平台
-- 数据库初始化与 PostgreSQL Row Level Security (RLS) 迁移脚本
-- 对应设计文档：docs/04-DATABASE.md
-- =============================================================================

-- 1. 启用 UUID 生成扩展与通用 updated_at 触发器函数
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. 学习目标表 (goals)
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  target_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. 项目表 (projects)
-- 注意：goal_id 允许为空（独立项目），删除目标时自动置空 (ON DELETE SET NULL)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  name text not null check (char_length(trim(name)) > 0),
  description text not null default '',
  due_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'on_hold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. 任务表 (tasks)
-- 注意：project_id 允许为空（独立任务），删除项目时保留任务并解除关联 (ON DELETE SET NULL)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  planned_date date,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. 每周复盘表 (weekly_reviews)
-- 注意：每位用户在每个自然周 (user_id, week_start) 只能有一条记录
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week_start date not null,
  achievements text not null default '',
  problems text not null default '',
  next_plan text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_reviews_user_week_unique unique (user_id, week_start)
);

-- 6. 索引优化
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_goal_id on public.projects(goal_id);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_dates on public.tasks(user_id, status, planned_date, due_date);
create index if not exists idx_weekly_reviews_user_week on public.weekly_reviews(user_id, week_start desc);

-- 7. 绑定 updated_at 触发器
drop trigger if exists trg_goals_updated_at on public.goals;
create trigger trg_goals_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists trg_weekly_reviews_updated_at on public.weekly_reviews;
create trigger trg_weekly_reviews_updated_at before update on public.weekly_reviews
  for each row execute function public.set_updated_at();

-- 8. 启用 RLS 与最小权限授予
alter table public.goals enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.weekly_reviews enable row level security;

revoke all on public.goals, public.projects, public.tasks, public.weekly_reviews from anon;
grant select, insert, update, delete on public.goals, public.projects, public.tasks, public.weekly_reviews to authenticated;

-- 9. goals RLS 策略
create policy "goals_select_own" on public.goals
  for select to authenticated using (user_id = auth.uid());
create policy "goals_insert_own" on public.goals
  for insert to authenticated with check (user_id = auth.uid());
create policy "goals_update_own" on public.goals
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals_delete_own" on public.goals
  for delete to authenticated using (user_id = auth.uid());

-- 10. projects RLS 策略（含跨用户 goal_id 绑定拦截）
create policy "projects_select_own" on public.projects
  for select to authenticated using (user_id = auth.uid());
create policy "projects_insert_own" on public.projects
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      goal_id is null
      or exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
    )
  );
create policy "projects_update_own" on public.projects
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      goal_id is null
      or exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
    )
  );
create policy "projects_delete_own" on public.projects
  for delete to authenticated using (user_id = auth.uid());

-- 11. tasks RLS 策略（含跨用户 project_id 绑定拦截）
create policy "tasks_select_own" on public.tasks
  for select to authenticated using (user_id = auth.uid());
create policy "tasks_insert_own" on public.tasks
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      project_id is null
      or exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
    )
  );
create policy "tasks_update_own" on public.tasks
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      project_id is null
      or exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
    )
  );
create policy "tasks_delete_own" on public.tasks
  for delete to authenticated using (user_id = auth.uid());

-- 12. weekly_reviews RLS 策略
create policy "weekly_reviews_select_own" on public.weekly_reviews
  for select to authenticated using (user_id = auth.uid());
create policy "weekly_reviews_insert_own" on public.weekly_reviews
  for insert to authenticated with check (user_id = auth.uid());
create policy "weekly_reviews_update_own" on public.weekly_reviews
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "weekly_reviews_delete_own" on public.weekly_reviews
  for delete to authenticated using (user_id = auth.uid());

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'vi-VN',
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.birth_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  raw_birth_input_json jsonb not null,
  normalized_birth_json jsonb not null,
  input_hash_digest text not null,
  retention_mode text not null default 'persistent' check (retention_mode in ('persistent', 'delete_on_user_request')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists birth_profiles_one_active_per_user_idx
  on public.birth_profiles (owner_user_id)
  where is_active = true and deleted_at is null;

create table if not exists public.chart_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  birth_profile_id uuid references public.birth_profiles(id) on delete set null,
  chart_system text not null,
  snapshot_dedupe_key text not null,
  chart_snapshot_json jsonb not null,
  engine_package text not null,
  engine_semver text not null,
  rule_source_name text not null,
  rule_source_version text not null,
  input_hash_digest text not null,
  confidence_level text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists chart_snapshots_owner_dedupe_idx
  on public.chart_snapshots (owner_user_id, snapshot_dedupe_key);
create index if not exists chart_snapshots_owner_created_idx
  on public.chart_snapshots (owner_user_id, created_at desc);

create table if not exists public.explanation_requests (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  chart_snapshot_id uuid not null references public.chart_snapshots(id) on delete cascade,
  idempotency_key text not null,
  request_state text not null check (request_state in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  provider_name text not null,
  prompt_storage_mode text not null default 'not_stored' check (prompt_storage_mode in ('not_stored', 'consented_redacted')),
  failure_retains_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists explanation_requests_owner_idempotency_idx
  on public.explanation_requests (owner_user_id, idempotency_key);
create index if not exists explanation_requests_owner_state_idx
  on public.explanation_requests (owner_user_id, request_state, created_at desc);

create table if not exists public.explanation_results (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  explanation_request_id uuid not null unique references public.explanation_requests(id) on delete cascade,
  chart_snapshot_id uuid not null references public.chart_snapshots(id) on delete cascade,
  cache_scope text not null default 'user_snapshot' check (cache_scope in ('user_snapshot', 'reference_only')),
  rendered_markdown text not null,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists explanation_results_owner_created_idx
  on public.explanation_results (owner_user_id, created_at desc);

create table if not exists public.history_views (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  chart_snapshot_id uuid references public.chart_snapshots(id) on delete cascade,
  explanation_result_id uuid references public.explanation_results(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists history_views_owner_viewed_idx
  on public.history_views (owner_user_id, viewed_at desc);

alter table public.profiles enable row level security;
alter table public.birth_profiles enable row level security;
alter table public.chart_snapshots enable row level security;
alter table public.explanation_requests enable row level security;
alter table public.explanation_results enable row level security;
alter table public.history_views enable row level security;

create policy "profiles_owner_select" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_owner_insert" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_owner_delete" on public.profiles
  for delete using (auth.uid() = user_id);

create policy "birth_profiles_owner_select" on public.birth_profiles
  for select using (auth.uid() = owner_user_id);
create policy "birth_profiles_owner_insert" on public.birth_profiles
  for insert with check (auth.uid() = owner_user_id);
create policy "birth_profiles_owner_update" on public.birth_profiles
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "birth_profiles_owner_delete" on public.birth_profiles
  for delete using (auth.uid() = owner_user_id);

create policy "chart_snapshots_owner_select" on public.chart_snapshots
  for select using (auth.uid() = owner_user_id);
create policy "chart_snapshots_owner_insert" on public.chart_snapshots
  for insert with check (auth.uid() = owner_user_id);
create policy "chart_snapshots_owner_update" on public.chart_snapshots
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "chart_snapshots_owner_delete" on public.chart_snapshots
  for delete using (auth.uid() = owner_user_id);

create policy "explanation_requests_owner_select" on public.explanation_requests
  for select using (auth.uid() = owner_user_id);
create policy "explanation_requests_owner_insert" on public.explanation_requests
  for insert with check (auth.uid() = owner_user_id);
create policy "explanation_requests_owner_update" on public.explanation_requests
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "explanation_requests_owner_delete" on public.explanation_requests
  for delete using (auth.uid() = owner_user_id);

create policy "explanation_results_owner_select" on public.explanation_results
  for select using (auth.uid() = owner_user_id);
create policy "explanation_results_owner_insert" on public.explanation_results
  for insert with check (auth.uid() = owner_user_id);
create policy "explanation_results_owner_update" on public.explanation_results
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "explanation_results_owner_delete" on public.explanation_results
  for delete using (auth.uid() = owner_user_id);

create policy "history_views_owner_select" on public.history_views
  for select using (auth.uid() = owner_user_id);
create policy "history_views_owner_insert" on public.history_views
  for insert with check (auth.uid() = owner_user_id);
create policy "history_views_owner_update" on public.history_views
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "history_views_owner_delete" on public.history_views
  for delete using (auth.uid() = owner_user_id);

-- rollback note:
-- this migration creates only user-owned persistence tables and indexes; rollback is safe by dropping these tables in reverse dependency order.

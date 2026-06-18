create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  chart_snapshot_id uuid not null references public.chart_snapshots(id) on delete cascade,
  title text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_owner_chart_idx
  on public.conversations (owner_user_id, chart_snapshot_id, created_at desc);
create index if not exists conversations_owner_status_idx
  on public.conversations (owner_user_id, status, created_at desc);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  quick_prompt_key text,
  provider_name text,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversation_messages_owner_conv_created_idx
  on public.conversation_messages (owner_user_id, conversation_id, created_at asc);

alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

create policy "conversations_owner_select" on public.conversations
  for select using (auth.uid() = owner_user_id);
create policy "conversations_owner_insert" on public.conversations
  for insert with check (auth.uid() = owner_user_id);
create policy "conversations_owner_update" on public.conversations
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "conversations_owner_delete" on public.conversations
  for delete using (auth.uid() = owner_user_id);

create policy "conversation_messages_owner_select" on public.conversation_messages
  for select using (auth.uid() = owner_user_id);
create policy "conversation_messages_owner_insert" on public.conversation_messages
  for insert with check (auth.uid() = owner_user_id);
create policy "conversation_messages_owner_update" on public.conversation_messages
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "conversation_messages_owner_delete" on public.conversation_messages
  for delete using (auth.uid() = owner_user_id);

-- rollback note:
-- this migration creates conversation and conversation_messages tables with RLS; rollback is safe by dropping these tables.

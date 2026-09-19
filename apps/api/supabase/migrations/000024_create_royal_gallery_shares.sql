-- Migration: 000024_create_royal_gallery_shares.sql
-- Purpose: Support Cloud Sync for Royal Gallery Shares (Thư Viện Hoàng Triều) with Tombstone Soft-Delete & UpdatedAt Trigger.

create table if not exists public.royal_gallery_shares (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  card_type text not null check (card_type in ('ziwei', 'sacredStick', 'tarot', 'iching')),
  title text not null,
  subtitle text,
  aspect_ratio text not null default 'standard' check (aspect_ratio in ('standard', 'story9_16')),
  custom_seal_name text,
  storage_path text,
  image_path text,
  image_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists royal_gallery_shares_owner_created_idx
  on public.royal_gallery_shares (owner_user_id, created_at desc);

create index if not exists royal_gallery_shares_owner_updated_idx
  on public.royal_gallery_shares (owner_user_id, updated_at desc);

-- Function & Trigger to automatically refresh updated_at on row modification
create or replace function public.set_royal_gallery_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists royal_gallery_shares_set_updated_at on public.royal_gallery_shares;
create trigger royal_gallery_shares_set_updated_at
  before update on public.royal_gallery_shares
  for each row execute function public.set_royal_gallery_updated_at();

alter table public.royal_gallery_shares enable row level security;

create policy "royal_gallery_shares_owner_select" on public.royal_gallery_shares
  for select using (auth.uid() = owner_user_id);

create policy "royal_gallery_shares_owner_insert" on public.royal_gallery_shares
  for insert with check (auth.uid() = owner_user_id);

create policy "royal_gallery_shares_owner_update" on public.royal_gallery_shares
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

create policy "royal_gallery_shares_owner_delete" on public.royal_gallery_shares
  for delete using (auth.uid() = owner_user_id);

-- Migration: 000024_create_royal_gallery_shares.sql
-- Purpose: Support Cloud Sync for Royal Gallery Shares (Thư Viện Hoàng Triều) for VIP PRO accounts.

create table if not exists public.royal_gallery_shares (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  card_type text not null check (card_type in ('ziwei', 'sacredStick', 'tarot', 'iching')),
  title text not null,
  subtitle text,
  aspect_ratio text not null default 'standard' check (aspect_ratio in ('standard', 'story9_16')),
  custom_seal_name text,
  image_path text,
  image_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists royal_gallery_shares_owner_created_idx
  on public.royal_gallery_shares (owner_user_id, created_at desc);

alter table public.royal_gallery_shares enable row level security;

create policy "royal_gallery_shares_owner_select" on public.royal_gallery_shares
  for select using (auth.uid() = owner_user_id);

create policy "royal_gallery_shares_owner_insert" on public.royal_gallery_shares
  for insert with check (auth.uid() = owner_user_id);

create policy "royal_gallery_shares_owner_update" on public.royal_gallery_shares
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

create policy "royal_gallery_shares_owner_delete" on public.royal_gallery_shares
  for delete using (auth.uid() = owner_user_id);

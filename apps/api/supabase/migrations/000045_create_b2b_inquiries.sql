-- Migration: 000045_create_b2b_inquiries.sql
-- Description: Store partner/realty inquiries from /doanh-nghiep (ADR-0009)

create table if not exists public.b2b_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text not null,
  email text,
  company text,
  need text not null default 'phong_thuy',
  message text,
  status text not null default 'new',
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS (Service role client in NestJS backend bypasses RLS)
alter table public.b2b_inquiries enable row level security;

-- Index on created_at for CRM lookup and sorting
create index if not exists idx_b2b_inquiries_created_at on public.b2b_inquiries (created_at desc);
create index if not exists idx_b2b_inquiries_phone on public.b2b_inquiries (phone);

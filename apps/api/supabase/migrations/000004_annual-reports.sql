-- US-016: bảng cache báo cáo năm (annual report) — Markdown do LLM sinh, idempotent theo
-- (chart_snapshot_id, year). Cache-hit trả lại Markdown cũ, KHÔNG gọi LLM (decision 0010 cache-hit).
-- RLS owner-only giống các bảng user-owned khác (migration 000001).

create table if not exists public.annual_reports (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  chart_snapshot_id uuid not null references public.chart_snapshots(id) on delete cascade,
  year integer not null check (year between 1900 and 2100),
  markdown text not null,
  provider_metadata jsonb,
  created_at timestamptz not null default now()
);

-- Unique (chart_snapshot_id, year): đảm bảo idempotent — POST cùng (chart, year) hai lần trả cùng
-- một Markdown. Race hai caller đồng thời → caller thua nhận unique violation rồi đọc lại row.
create unique index if not exists annual_reports_chart_year_idx
  on public.annual_reports (chart_snapshot_id, year);
create index if not exists annual_reports_owner_created_idx
  on public.annual_reports (owner_user_id, created_at desc);

alter table public.annual_reports enable row level security;
create policy "annual_reports_owner_only"
  on public.annual_reports
  for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

-- rollback note: bảng user-owned độc lập (không có FK ngược chiều từ bảng khác trỏ vào);
-- rollback an toàn bằng cách drop policy → index → table (xem 000004_annual-reports.down.sql).

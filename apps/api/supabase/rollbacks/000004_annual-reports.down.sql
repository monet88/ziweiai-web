-- Rollback US-016 annual_reports (drop theo thứ tự ngược: policy → index → table).
drop policy if exists "annual_reports_owner_only" on public.annual_reports;
drop index if exists public.annual_reports_owner_created_idx;
drop index if exists public.annual_reports_chart_year_idx;
drop table if exists public.annual_reports;

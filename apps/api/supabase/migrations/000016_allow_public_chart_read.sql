-- 000016_allow_public_chart_read.sql
-- Allow any user (authenticated or anon) to view a chart if they have the specific UUID

DO $$ BEGIN
  -- Drop existing policy if we are re-running or replacing
  drop policy if exists "chart_snapshots_owner_select" on public.chart_snapshots;
  drop policy if exists "chart_snapshots_public_read" on public.chart_snapshots;
EXCEPTION
  WHEN undefined_object THEN
    null;
END $$;

-- Allow public read access to all charts via their UUID
create policy "chart_snapshots_public_read" on public.chart_snapshots
  for select using (true);

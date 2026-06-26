-- US-017 follow-up (decision 0023): persist Xem Tướng / Xem Tay results to history.
-- Reverses the "vision results are ephemeral, image auto-deleted after 7 days" stance of
-- decision 0012: the product owner chose to keep image + narrative + question permanently so
-- vision readings appear in history like every other system. Run after 000008.

-- New table: one row per vision analysis (face/palm). Parallels explanation_results, but vision
-- has no chart_snapshot_id / explanation_request_id (no birth chart, no idempotency request row).
create table if not exists public.vision_results (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('face', 'palm')),
  image_path text not null,                       -- Storage path inside private bucket vision-uploads
  question text,                                  -- nullable: optional user question
  rendered_markdown text not null,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vision_results_owner_created_idx
  on public.vision_results (owner_user_id, created_at desc);

-- History link: a vision reading is a history_views row pointing at vision_result_id (mirrors
-- explanation_result_id). Nullable + cascade delete, consistent with the other view targets.
alter table public.history_views
  add column if not exists vision_result_id uuid references public.vision_results(id) on delete cascade;

-- RLS owner-only, scoped to the authenticated role (consistent with 000006 / decision 0020).
alter table public.vision_results enable row level security;

create policy "vision_results_owner_select" on public.vision_results
  for select to authenticated using (auth.uid() = owner_user_id);
create policy "vision_results_owner_insert" on public.vision_results
  for insert to authenticated with check (auth.uid() = owner_user_id);
create policy "vision_results_owner_update" on public.vision_results
  for update to authenticated using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "vision_results_owner_delete" on public.vision_results
  for delete to authenticated using (auth.uid() = owner_user_id);

-- Stop auto-deleting vision images: decision 0023 keeps them permanently. Unschedule the cron job
-- created in 000002 if pg_cron is available; skip cleanly when the extension is absent (local/CI).
-- The bucket stays private + RLS owner-only; images are now read via short-lived signed URLs.
do $$
begin
  if to_regclass('cron.job') is not null
    and to_regprocedure('cron.unschedule(text)') is not null then
    if exists (select 1 from cron.job where jobname = 'vision-uploads-cleanup') then
      perform cron.unschedule('vision-uploads-cleanup');
    end if;
  end if;
end
$$;

-- rollback note:
-- to revert, re-run the cron.schedule block from 000002, then:
--   alter table public.history_views drop column if exists vision_result_id;
--   drop table if exists public.vision_results cascade;

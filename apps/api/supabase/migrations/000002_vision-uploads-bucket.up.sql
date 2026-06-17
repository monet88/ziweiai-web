-- US-017 P2: private Storage bucket for vision (face/palm) uploads
-- Run after 000001_user-owned-astrology-records.

insert into storage.buckets (id, name, public)
values ('vision-uploads', 'vision-uploads', false)
on conflict (id) do update set public = excluded.public;

-- RLS policies: owner-only (folder đầu tiên = auth.uid()).
-- Objects are stored as {owner_user_id}/{request_id}.{ext} inside bucket vision-uploads.

drop policy if exists "vision_uploads_owner_select" on storage.objects;
create policy "vision_uploads_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'vision-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "vision_uploads_owner_insert" on storage.objects;
create policy "vision_uploads_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'vision-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "vision_uploads_owner_delete" on storage.objects;
create policy "vision_uploads_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'vision-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Scheduled cleanup: delete objects older than 7 days, daily at 03:00 UTC.
-- Requires pg_cron extension (enabled on Supabase by default on most plans).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'vision-uploads-cleanup') then
    perform cron.unschedule('vision-uploads-cleanup');
  end if;

  perform cron.schedule(
    'vision-uploads-cleanup',
    '0 3 * * *',
    $job$
    delete from storage.objects
    where bucket_id = 'vision-uploads'
      and created_at < now() - interval '7 days';
    $job$
  );
end
$$;

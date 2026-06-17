-- Rollback for 000002_vision-uploads-bucket

-- Drop cron job if present
do $$
begin
  if exists (select 1 from cron.job where jobname = 'vision-uploads-cleanup') then
    perform cron.unschedule('vision-uploads-cleanup');
  end if;
end
$$;

-- Drop policies (if they exist)
drop policy if exists "vision_uploads_owner_select" on storage.objects;
drop policy if exists "vision_uploads_owner_insert" on storage.objects;
drop policy if exists "vision_uploads_owner_delete" on storage.objects;

-- Remove objects before deleting the bucket.
delete from storage.objects where bucket_id = 'vision-uploads';
delete from storage.buckets where id = 'vision-uploads';

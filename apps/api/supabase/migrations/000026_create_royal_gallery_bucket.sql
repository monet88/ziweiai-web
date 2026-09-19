-- Migration 000026: Tạo Storage Bucket riêng cho Thư Viện Hoàng Triều (Royal Gallery)
-- Tách biệt hoàn toàn khỏi bucket tạm thời 'vision-uploads' (vốn có cron cleanup xóa sau 7 ngày).
-- Bucket 'royal-gallery' lưu trữ vĩnh viễn, bảo mật theo RLS User ID.

insert into storage.buckets (id, name, public)
values ('royal-gallery', 'royal-gallery', false)
on conflict (id) do update set public = excluded.public;

-- RLS policies cho bucket royal-gallery:
-- Cấu trúc lưu trữ: {owner_user_id}/{card_id}.{ext}
-- (storage.foldername(name))[1] = owner_user_id

drop policy if exists "royal_gallery_owner_select" on storage.objects;
create policy "royal_gallery_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'royal-gallery'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "royal_gallery_owner_insert" on storage.objects;
create policy "royal_gallery_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'royal-gallery'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "royal_gallery_owner_delete" on storage.objects;
create policy "royal_gallery_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'royal-gallery'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Cập nhật pg_cron job cleanup của vision-uploads:
-- Đảm bảo chỉ xóa các object tạm thời (nhân tướng / chỉ tay) và không bao giờ xóa nhầm royal-gallery.
do $$
begin
  if to_regclass('cron.job') is not null
    and to_regprocedure('cron.unschedule(text)') is not null
    and to_regprocedure('cron.schedule(text,text,text)') is not null then
    
    if exists (select 1 from cron.job where jobname = 'vision-uploads-cleanup') then
      perform cron.unschedule('vision-uploads-cleanup');
    end if;

    perform cron.schedule(
      'vision-uploads-cleanup',
      '0 3 * * *',
      $job$
      delete from storage.objects
      where bucket_id = 'vision-uploads'
        and name not like 'royal-gallery/%'
        and created_at < now() - interval '7 days';
      $job$
    );
  end if;
end
$$;

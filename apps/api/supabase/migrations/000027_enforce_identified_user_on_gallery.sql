-- Migration 000027: Siết Chặt Quyền Truy Cập Thư Viện Hoàng Triều (Identified User Only)
-- Ngăn chặn triệt để tài khoản Anonymous ghi vào Database hoặc Storage của Thư Viện Hoàng Triều.
-- Yêu cầu bắt buộc tài khoản có email xác thực và không phải anonymous session.

-- 1. Cập nhật RLS Policies cho bảng public.royal_gallery_shares

drop policy if exists "royal_gallery_shares_owner_select" on public.royal_gallery_shares;
create policy "royal_gallery_shares_owner_select" on public.royal_gallery_shares
  for select using (
    auth.uid() = owner_user_id
    and (auth.jwt() ->> 'email') is not null
    and (auth.jwt() ->> 'email') != ''
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

drop policy if exists "royal_gallery_shares_owner_insert" on public.royal_gallery_shares;
create policy "royal_gallery_shares_owner_insert" on public.royal_gallery_shares
  for insert with check (
    auth.uid() = owner_user_id
    and (auth.jwt() ->> 'email') is not null
    and (auth.jwt() ->> 'email') != ''
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

drop policy if exists "royal_gallery_shares_owner_update" on public.royal_gallery_shares;
create policy "royal_gallery_shares_owner_update" on public.royal_gallery_shares
  for update using (
    auth.uid() = owner_user_id
    and (auth.jwt() ->> 'email') is not null
    and (auth.jwt() ->> 'email') != ''
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  ) with check (
    auth.uid() = owner_user_id
    and (auth.jwt() ->> 'email') is not null
    and (auth.jwt() ->> 'email') != ''
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

drop policy if exists "royal_gallery_shares_owner_delete" on public.royal_gallery_shares;
create policy "royal_gallery_shares_owner_delete" on public.royal_gallery_shares
  for delete using (
    auth.uid() = owner_user_id
    and (auth.jwt() ->> 'email') is not null
    and (auth.jwt() ->> 'email') != ''
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

-- 2. Cập nhật RLS Policies cho Storage bucket 'royal-gallery'

drop policy if exists "royal_gallery_owner_select" on storage.objects;
create policy "royal_gallery_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'royal-gallery'
    and auth.uid()::text = (storage.foldername(name))[1]
    and (auth.jwt() ->> 'email') is not null
    and (auth.jwt() ->> 'email') != ''
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

drop policy if exists "royal_gallery_owner_insert" on storage.objects;
create policy "royal_gallery_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'royal-gallery'
    and auth.uid()::text = (storage.foldername(name))[1]
    and (auth.jwt() ->> 'email') is not null
    and (auth.jwt() ->> 'email') != ''
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

drop policy if exists "royal_gallery_owner_delete" on storage.objects;
create policy "royal_gallery_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'royal-gallery'
    and auth.uid()::text = (storage.foldername(name))[1]
    and (auth.jwt() ->> 'email') is not null
    and (auth.jwt() ->> 'email') != ''
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

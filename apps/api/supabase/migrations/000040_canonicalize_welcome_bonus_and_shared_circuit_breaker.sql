-- ==============================================================================
-- Migration 000040: Canonicalize Welcome Bonus Claims & Deduplicate Aliases
-- Bảo đảm tính nhất quán dữ liệu lịch sử và chống schema drift
-- ==============================================================================

-- 1. Bảo đảm hàm normalize_email_address tồn tại và mới nhất
create or replace function public.normalize_email_address(p_email text)
returns text language plpgsql immutable as $$
declare
  v_email text;
  v_local text;
  v_domain text;
begin
  if p_email is null or trim(p_email) = '' then
    return null;
  end if;

  v_email := lower(trim(p_email));
  if position('@' in v_email) = 0 then
    return v_email;
  end if;

  v_local := split_part(v_email, '@', 1);
  v_domain := split_part(v_email, '@', 2);

  -- Cắt bỏ phần sau dấu cộng (+)
  if position('+' in v_local) > 0 then
    v_local := split_part(v_local, '+', 1);
  end if;

  -- Nếu là Gmail / Googlemail, loại bỏ toàn bộ dấu chấm (.)
  if v_domain = 'gmail.com' or v_domain = 'googlemail.com' then
    v_local := replace(v_local, '.', '');
    v_domain := 'gmail.com';
  end if;

  return v_local || '@' || v_domain;
end;
$$;

-- 2. Canonicalize toàn bộ dữ liệu hiện có trong welcome_bonus_claims
update public.welcome_bonus_claims c
set 
  email = coalesce(c.email, u.email),
  normalized_email = public.normalize_email_address(coalesce(c.email, u.email))
from auth.users u
where c.user_id = u.id;

-- 3. Xóa các bản ghi trùng lặp do trick alias lịch sử nếu có (giữ bản ghi được claim sớm nhất)
delete from public.welcome_bonus_claims a
using public.welcome_bonus_claims b
where a.normalized_email = b.normalized_email
  and a.claimed_at > b.claimed_at;

-- 4. Tái lập Unique Index an toàn tuyệt đối
drop index if exists public.welcome_bonus_claims_normalized_email_idx;
create unique index if not exists welcome_bonus_claims_normalized_email_idx 
  on public.welcome_bonus_claims (normalized_email);

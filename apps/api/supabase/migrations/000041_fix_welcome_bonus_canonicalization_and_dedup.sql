-- ==============================================================================
-- Migration 000041: Safe Canonicalization & Deduplication of Welcome Bonus Claims
-- Khắc phục triệt để lỗi thứ tự: Drop index trước khi canonicalize,
-- deduplicate an toàn bằng ctid và ROW_NUMBER(), rồi mới tái lập unique index.
-- ==============================================================================

-- 1. Bảo đảm hàm normalize_email_address tồn tại và chuẩn hóa chính xác
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

-- 2. TẠM THỜI DROP UNIQUE INDEX để việc UPDATE canonicalization không bị vướng lỗi duplicate key
drop index if exists public.welcome_bonus_claims_normalized_email_idx;

-- 3. Canonicalize toàn bộ dữ liệu trong welcome_bonus_claims
update public.welcome_bonus_claims c
set 
  email = coalesce(c.email, u.email),
  normalized_email = public.normalize_email_address(coalesce(c.email, u.email))
from auth.users u
where c.user_id = u.id;

-- 4. Deduplicate và đối soát sổ cái (Ledger Reconciliation):
-- Với mọi bản ghi trùng lặp (rn > 1):
-- a) Ghi nhận bút toán đảo giao dịch vào public.xu_transactions
-- b) Khấu trừ số dư profiles.xu_balance tương ứng
-- c) Xoá claim duplicate khỏi public.welcome_bonus_claims
do $$
declare
  r record;
begin
  for r in (
    with ranked_claims as (
      select ctid,
             user_id,
             reward_xu,
             normalized_email,
             row_number() over (
               partition by normalized_email 
               order by claimed_at asc, user_id asc
             ) as rn
      from public.welcome_bonus_claims
      where normalized_email is not null
    )
    select ctid, user_id, coalesce(reward_xu, 15) as reward_xu, normalized_email
    from ranked_claims
    where rn > 1
  ) loop
    -- Ghi bút toán đảo đối soát vào xu_transactions
    insert into public.xu_transactions (
      user_id,
      amount,
      transaction_type,
      actor_email
    ) values (
      r.user_id,
      -r.reward_xu,
      'welcome_bonus_duplicate_reversal',
      'system_migration_000041'
    );

    -- Khấu trừ số dư ví người dùng, không bao giờ để âm
    update public.profiles
    set xu_balance = greatest(0, coalesce(xu_balance, 0) - r.reward_xu)
    where user_id = r.user_id;

    -- Xoá bản ghi duplicate claim
    delete from public.welcome_bonus_claims
    where ctid = r.ctid;
  end loop;
end;
$$;

-- 5. TÁI LẬP UNIQUE INDEX an toàn sau khi bảng đã sạch 100% duplicate
create unique index if not exists welcome_bonus_claims_normalized_email_idx 
  on public.welcome_bonus_claims (normalized_email);

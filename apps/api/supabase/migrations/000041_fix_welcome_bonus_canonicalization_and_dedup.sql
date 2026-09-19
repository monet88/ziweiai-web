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

-- 4. Deduplicate và đối soát sổ cái chuẩn mực kế toán (Ledger Reconciliation):
-- Với mọi bản ghi trùng lặp (rn > 1):
-- a) Tính số tiền thực tế có thể thu hồi từ số dư ví:
--    v_recoverable_xu = least(greatest(0, coalesce(p.xu_balance, 0)), r.reward_xu)
-- b) Khấu trừ đúng v_recoverable_xu từ ví và ghi transaction đảo -v_recoverable_xu.
--    => Bảo đảm 100% tuyệt đối: profiles.xu_balance LUÔN BẰNG tổng xu_transactions.
-- c) Nếu người dùng đã tiêu một phần hoặc toàn bộ bonus trước đó (v_unrecoverable_xu > 0):
--    Ghi nhận dòng audit memo (amount = 0) lưu vết kiểm toán phần XU đã bị tiêu.
-- d) Xoá claim duplicate khỏi public.welcome_bonus_claims.
do $$
declare
  r record;
  v_current_balance int;
  v_recoverable_xu int;
  v_unrecoverable_xu int;
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
    -- Lấy số dư ví hiện tại của profile
    select coalesce(xu_balance, 0) into v_current_balance
    from public.profiles
    where user_id = r.user_id;

    -- Tính số XU thực tế còn nằm trong ví có thể thu hồi
    v_recoverable_xu := least(greatest(0, v_current_balance), r.reward_xu);
    v_unrecoverable_xu := r.reward_xu - v_recoverable_xu;

    -- 1. Nếu ví còn XU, ghi nhận giao dịch đảo tương ứng và khấu trừ số dư
    if v_recoverable_xu > 0 then
      insert into public.xu_transactions (
        user_id,
        amount,
        transaction_type,
        actor_email
      ) values (
        r.user_id,
        -v_recoverable_xu,
        'welcome_bonus_duplicate_reversal',
        'system_migration_000041'
      );

      update public.profiles
      set xu_balance = xu_balance - v_recoverable_xu
      where user_id = r.user_id;
    end if;

    -- 2. Nếu user đã tiêu mất bonus trước đó, ghi nhận audit memo (amount = 0)
    if v_unrecoverable_xu > 0 then
      insert into public.xu_transactions (
        user_id,
        amount,
        transaction_type,
        actor_email
      ) values (
        r.user_id,
        0,
        'welcome_bonus_duplicate_unrecoverable_consumed',
        'system_migration_000041: unrecoverable ' || v_unrecoverable_xu || ' xu consumed prior to migration'
      );
    end if;

    -- 3. Xoá bản ghi duplicate claim
    delete from public.welcome_bonus_claims
    where ctid = r.ctid;
  end loop;
end;
$$;

-- 5. TÁI LẬP UNIQUE INDEX an toàn sau khi bảng đã sạch 100% duplicate
create unique index if not exists welcome_bonus_claims_normalized_email_idx 
  on public.welcome_bonus_claims (normalized_email);

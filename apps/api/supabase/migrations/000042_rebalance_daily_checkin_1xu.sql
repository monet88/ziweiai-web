-- ==============================================================================
-- Migration 000042: Cân bằng kinh tế XU - Đồng bộ Thưởng Điểm Danh Hằng Ngày
-- Thưởng cơ bản: 1 XU/ngày
-- Mốc 7 ngày liên tục (Jackpot): +2 XU thưởng thêm (= 3 XU)
-- ==============================================================================

create or replace function public.daily_checkin(
  p_user_id uuid,
  p_referral_code text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_last_checkin date;
  v_balance integer;
  v_streak integer := 1;
  v_reward integer := 1;
  v_new_balance integer;
  v_is_anonymous boolean;
  v_user_email text;
  v_referrer_id uuid;
  v_referrer_code text;
  v_referrer_balance integer;
  v_ref_new_balance integer;
  v_ref_today_count integer := 0;
  v_referrer_email text;
  v_first_id uuid;
  v_second_id uuid;
begin
  -- Giờ chuẩn Việt Nam (UTC+7)
  v_today := (timezone('Asia/Ho_Chi_Minh', now()))::date;

  -- 1. Chặn tài khoản ẩn danh
  select coalesce(is_anonymous, false), email 
  into v_is_anonymous, v_user_email
  from auth.users
  where id = p_user_id;

  if not found then
    raise exception 'Người dùng không tồn tại';
  end if;

  if v_is_anonymous or v_user_email is null or trim(v_user_email) = '' then
    raise exception 'Tính năng điểm danh và nhận thưởng XU yêu cầu tài khoản đăng nhập bằng Email.';
  end if;

  -- 2. Nếu có mã giới thiệu, tìm trước ID người giới thiệu
  if p_referral_code is not null and length(trim(p_referral_code)) > 0 then
    select user_id, referral_code into v_referrer_id, v_referrer_code
    from public.profiles
    where referral_code = upper(trim(p_referral_code));
  end if;

  -- 3. Khóa hàng chống deadlock (Deterministic Alphabetical Row Locking)
  if v_referrer_id is not null and v_referrer_id <> p_user_id then
    if p_user_id < v_referrer_id then
      v_first_id := p_user_id;
      v_second_id := v_referrer_id;
    else
      v_first_id := v_referrer_id;
      v_second_id := p_user_id;
    end if;

    perform 1 from public.profiles where user_id = v_first_id for update;
    perform 1 from public.profiles where user_id = v_second_id for update;
  else
    perform 1 from public.profiles where user_id = p_user_id for update;
  end if;

  -- 4. Đọc dữ liệu profile của user hiện tại
  select last_checkin_date, coalesce(xu_balance, 0), coalesce(checkin_streak, 0)
  into v_last_checkin, v_balance, v_streak
  from public.profiles
  where user_id = p_user_id;

  -- 5. Kiểm tra nếu đã điểm danh hôm nay
  if v_last_checkin = v_today then
    return 0;
  end if;

  -- 6. Tính chuỗi điểm danh (Streak)
  if v_last_checkin = v_today - 1 then
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  -- Thưởng cơ bản 1 XU; mốc 7 ngày liên tiếp thưởng thêm +2 XU (= 3 XU)
  v_reward := 1;
  if v_streak % 7 = 0 then
    v_reward := v_reward + 2;
  end if;

  -- 7. Cập nhật ví và streak
  update public.profiles
  set 
    xu_balance = xu_balance + v_reward,
    last_checkin_date = v_today,
    checkin_streak = v_streak
  where user_id = p_user_id
  returning xu_balance into v_new_balance;

  -- 8. Ghi sổ cái xu_transactions
  insert into public.xu_transactions (user_id, amount, balance_after, transaction_type, metadata)
  values (
    p_user_id,
    v_reward,
    v_new_balance,
    'daily_checkin',
    jsonb_build_object(
      'streak', v_streak,
      'date', v_today,
      'bonus', (v_streak % 7 = 0),
      'ip_note', 'authenticated_checkin'
    )
  );

  -- 9. Xử lý thưởng người giới thiệu (chỉ 1 lần đầu tiên)
  if v_referrer_id is not null and v_referrer_id <> p_user_id then
    if not exists (select 1 from public.referrals where referee_id = p_user_id) then
      select count(*) into v_ref_today_count
      from public.referrals
      where referrer_id = v_referrer_id
        and (timezone('Asia/Ho_Chi_Minh', created_at))::date = v_today;

      select email into v_referrer_email
      from auth.users
      where id = v_referrer_id;

      if v_ref_today_count < 10 
         and v_referrer_email is not null 
         and trim(v_referrer_email) <> '' 
         and lower(trim(v_referrer_email)) <> lower(trim(v_user_email)) then
        
        insert into public.referrals (referrer_id, referee_id, reward_xu, status, completed_at)
        values (v_referrer_id, p_user_id, 10, 'completed', now());

        update public.profiles
        set xu_balance = xu_balance + 10
        where user_id = v_referrer_id
        returning xu_balance into v_ref_new_balance;

        insert into public.xu_transactions (user_id, amount, balance_after, transaction_type, metadata)
        values (
          v_referrer_id,
          10,
          v_ref_new_balance,
          'referral_reward',
          jsonb_build_object(
            'referee_id', p_user_id,
            'source', 'daily_checkin_first'
          )
        );
      end if;
    end if;
  end if;

  return v_reward;
end;
$$;

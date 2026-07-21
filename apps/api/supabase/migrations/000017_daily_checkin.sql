-- Add last_checkin_date to profiles
alter table public.profiles
  add column if not exists last_checkin_date date;

-- RPC for race-condition safe daily checkin
create or replace function public.daily_checkin(user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  current_last_checkin date;
  today date;
  reward_xu constant integer := 5;
begin
  -- Use UTC+7 (Vietnam time)
  today := (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  select last_checkin_date into current_last_checkin
  from public.profiles
  where profiles.user_id = daily_checkin.user_id
  for update; -- Lock row to prevent race conditions

  if current_last_checkin is null or current_last_checkin < today then
    -- Can check in
    update public.profiles
    set 
      xu_balance = xu_balance + reward_xu,
      last_checkin_date = today
    where profiles.user_id = daily_checkin.user_id;
    
    return true;
  else
    return false;
  end if;
end;
$$;

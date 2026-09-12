-- Migration: 000029_referral_leaderboard_rpc.sql
-- Description: Aggregate dynamic referral leaderboard from referrals and profiles table

create or replace function public.get_referral_leaderboard(p_limit integer default 10)
returns table (
  referrer_id uuid,
  masked_name text,
  referral_count bigint,
  reward_xu_earned bigint
)
language sql
security definer
as $$
  select 
    r.referrer_id,
    coalesce(p.display_name, 'Sứ Giả Ẩn Danh') as masked_name,
    count(r.id)::bigint as referral_count,
    coalesce(sum(r.reward_xu), 0)::bigint as reward_xu_earned
  from public.referrals r
  left join public.profiles p on p.user_id = r.referrer_id
  where r.status = 'completed'
  group by r.referrer_id, p.display_name
  order by referral_count desc, reward_xu_earned desc
  limit coalesce(p_limit, 10);
$$;

-- Grant execution to authenticated & service_role
grant execute on function public.get_referral_leaderboard(integer) to authenticated, anon, service_role;

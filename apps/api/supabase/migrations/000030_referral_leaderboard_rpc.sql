-- Migration: 000030_referral_leaderboard_rpc.sql
-- Description: Aggregate dynamic referral leaderboard from referrals and profiles table with SQL-level masking and tightened ACL

create or replace function public.get_referral_leaderboard(p_limit integer default 10)
returns table (
  referrer_id uuid,
  masked_name text,
  referral_count bigint,
  reward_xu_earned bigint
)
language sql
security definer
set search_path = public
as $$
  select 
    r.referrer_id,
    case 
      when p.display_name is null then 'Sứ Giả Ẩn Danh'
      when position('@' in p.display_name) > 0 then
        substr(split_part(p.display_name, '@', 1), 1, 3) || '***@' || split_part(p.display_name, '@', 2)
      when length(p.display_name) > 3 then
        substr(p.display_name, 1, 3) || '***'
      else 'Sứ Giả Ẩn Danh'
    end as masked_name,
    count(r.id)::bigint as referral_count,
    coalesce(sum(r.reward_xu), 0)::bigint as reward_xu_earned
  from public.referrals r
  left join public.profiles p on p.user_id = r.referrer_id
  where r.status = 'completed'
  group by r.referrer_id, p.display_name
  order by referral_count desc, reward_xu_earned desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

-- Revoke from anon, only allow authenticated and service_role
revoke execute on function public.get_referral_leaderboard(integer) from public, anon;
grant execute on function public.get_referral_leaderboard(integer) to authenticated, service_role;

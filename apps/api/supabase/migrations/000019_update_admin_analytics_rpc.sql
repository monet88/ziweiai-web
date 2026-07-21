-- Update RPC for Admin Analytics with feature breakdown and flexible dates
CREATE OR REPLACE FUNCTION public.get_admin_analytics(
  p_start_date date default null,
  p_end_date date default null
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_users integer;
  v_total_xu_topup integer;
  v_total_xu_consumed integer;
  v_daily_stats json;
  v_feature_usage json;
  v_actual_start date;
  v_actual_end date;
BEGIN
  -- Default to last 30 days if no dates provided
  IF p_start_date IS NULL THEN
    v_actual_start := current_date - interval '30 days';
  ELSE
    v_actual_start := p_start_date;
  END IF;

  IF p_end_date IS NULL THEN
    v_actual_end := current_date;
  ELSE
    v_actual_end := p_end_date;
  END IF;

  -- Total users (overall, regardless of date range)
  SELECT count(*) INTO v_total_users FROM public.profiles;

  -- Total XU Topup within date range
  SELECT coalesce(sum(amount), 0) INTO v_total_xu_topup 
  FROM public.xu_transactions 
  WHERE amount > 0 
    AND created_at >= v_actual_start 
    AND created_at <= (v_actual_end + interval '1 day');

  -- Total XU Consumed within date range
  SELECT coalesce(sum(abs(amount)), 0) INTO v_total_xu_consumed 
  FROM public.xu_transactions 
  WHERE amount < 0 
    AND created_at >= v_actual_start 
    AND created_at <= (v_actual_end + interval '1 day');

  -- Daily stats
  WITH date_series AS (
    SELECT generate_series(
      v_actual_start::timestamp,
      v_actual_end::timestamp,
      '1 day'::interval
    ) AS date
  ),
  daily_users AS (
    SELECT date_trunc('day', created_at) AS date, count(*) AS new_users
    FROM public.profiles
    WHERE created_at >= v_actual_start AND created_at <= (v_actual_end + interval '1 day')
    GROUP BY 1
  ),
  daily_xu AS (
    SELECT 
      date_trunc('day', created_at) AS date,
      coalesce(sum(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS xu_topup,
      coalesce(sum(CASE WHEN amount < 0 THEN abs(amount) ELSE 0 END), 0) AS xu_consumed
    FROM public.xu_transactions
    WHERE created_at >= v_actual_start AND created_at <= (v_actual_end + interval '1 day')
    GROUP BY 1
  )
  SELECT json_agg(
    json_build_object(
      'date', to_char(ds.date, 'YYYY-MM-DD'),
      'new_users', coalesce(du.new_users, 0),
      'xu_topup', coalesce(dx.xu_topup, 0),
      'xu_consumed', coalesce(dx.xu_consumed, 0)
    ) ORDER BY ds.date ASC
  ) INTO v_daily_stats
  FROM date_series ds
  LEFT JOIN daily_users du ON ds.date = du.date
  LEFT JOIN daily_xu dx ON ds.date = dx.date;

  -- Feature usage breakdown (group by transaction_type for consumed XU)
  SELECT json_agg(
    json_build_object(
      'feature', transaction_type,
      'consumed', abs(total_consumed)
    ) ORDER BY abs(total_consumed) DESC
  ) INTO v_feature_usage
  FROM (
    SELECT transaction_type, sum(amount) as total_consumed
    FROM public.xu_transactions
    WHERE amount < 0
      AND created_at >= v_actual_start 
      AND created_at <= (v_actual_end + interval '1 day')
    GROUP BY transaction_type
  ) subq;

  RETURN json_build_object(
    'total_users', v_total_users,
    'total_xu_topup', v_total_xu_topup,
    'total_xu_consumed', v_total_xu_consumed,
    'daily_stats', coalesce(v_daily_stats, '[]'::json),
    'feature_usage', coalesce(v_feature_usage, '[]'::json)
  );
END;
$$;

-- Keep security locked down
REVOKE EXECUTE ON FUNCTION public.get_admin_analytics(date, date) FROM public, anon, authenticated;

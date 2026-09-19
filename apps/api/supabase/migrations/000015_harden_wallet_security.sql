-- Migration: Harden Wallet Security
-- 1. Revoke direct execute access from client roles for sensitive RPCs.
-- This ensures only the backend (using service_role) can invoke these functions.
REVOKE EXECUTE ON FUNCTION public.log_xu_transaction(uuid, integer, text, text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_xu(uuid, integer) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_xu(uuid, integer) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_analytics(integer) FROM public, anon, authenticated;

-- 2. Protect xu_balance column in profiles table from direct user modification via REST API/RLS.
CREATE OR REPLACE FUNCTION public.protect_xu_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Only block if the current user is a web client (anon or authenticated).
  -- The API service_role will not match these session roles and will bypass this check.
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.xu_balance IS DISTINCT FROM OLD.xu_balance THEN
      RAISE EXCEPTION 'Direct modification of xu_balance is not permitted. Please use top-up API.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_xu_balance_trigger ON public.profiles;
CREATE TRIGGER protect_xu_balance_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_xu_balance();

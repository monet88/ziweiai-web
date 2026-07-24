-- Ensure signup trigger populates referral_code (required after 000018 NOT NULL).
-- Production was patched during 2026-07-24 redeem incident; keep repo in sync.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.profiles (user_id, display_name, referral_code)
  values (
    new.id,
    new.email,
    upper(substr(md5(new.id::text || random()::text), 1, 8))
  );
  return new;
end;
$$;

-- US-017 follow-up (decision 0023, review hardening): constrain vision_results.image_path to the
-- row owner's folder. Without this, a user with their own JWT could insert a row where
-- owner_user_id = self but image_path = '{victim_id}/...jpg'. The history list signs that path with
-- the service-role client (which bypasses Storage RLS), handing back a signed URL to someone else's
-- biometric image — a cross-user leak. The upload path is always '{ownerUserId}/{requestId}.{ext}'
-- (vision-storage.gateway), so the first path segment must equal owner_user_id. Enforce it at the DB
-- so the private-bucket isolation does not depend solely on application code being correct.
-- Run after 000009.

alter table public.vision_results
  add constraint vision_results_image_path_owner_scoped
  check (image_path like owner_user_id::text || '/%');

-- rollback note:
--   alter table public.vision_results drop constraint if exists vision_results_image_path_owner_scoped;

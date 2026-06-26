-- US-017 follow-up (decision 0023, review hardening): constrain vision_results.image_path to the
-- row owner's folder. Without this, a user with their own JWT could insert a row where
-- owner_user_id = self but image_path = '{victim_id}/...jpg'. The history list signs that path with
-- the service-role client (which bypasses Storage RLS), handing back a signed URL to someone else's
-- biometric image — a cross-user leak. The upload path is always '{ownerUserId}/{requestId}.{ext}'
-- (vision-storage.gateway), so the first path segment must equal owner_user_id. Enforce it at the DB
-- so the private-bucket isolation does not depend solely on application code being correct.
-- Run after 000009.

-- Hai bước để an toàn rollout mà vẫn kết thúc ở trạng thái VALIDATED (khớp prod — xác nhận
-- 2026-06-26 qua Management API: constraint đã tồn tại, convalidated=true, 11 row, 0 vi phạm):
--   1. ADD ... NOT VALID: thêm constraint với lock NHẸ, KHÔNG scan toàn bảng → enforce mọi
--      INSERT/UPDATE mới ngay (đóng lỗ rò cross-user) mà không chặn rollout trên môi trường đã có
--      row từ 000009 (cùng release).
--   2. VALIDATE CONSTRAINT: scan các row cũ với lock SHARE UPDATE EXCLUSIVE (vẫn cho read/write,
--      không như ADD validated dùng ACCESS EXCLUSIVE). An toàn vì image_path luôn do server ghi
--      dạng '{ownerUserId}/{requestId}.{ext}' (vision-storage.gateway) → không có row nonconforming.
-- Run after 000009.
alter table public.vision_results
  add constraint vision_results_image_path_owner_scoped
  check (image_path like owner_user_id::text || '/%')
  not valid;

alter table public.vision_results
  validate constraint vision_results_image_path_owner_scoped;

-- rollback note:
--   alter table public.vision_results drop constraint if exists vision_results_image_path_owner_scoped;

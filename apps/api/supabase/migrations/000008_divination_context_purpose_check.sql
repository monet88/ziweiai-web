-- US-025/US-026 follow-up (PR #38 review): enforce the purpose_key / purpose_custom
-- coupling at the database layer. The free-text label is valid (and non-empty after
-- trimming) only for the 'custom' preset; every other purpose_key must leave
-- purpose_custom NULL. This mirrors the contracts superRefine on
-- divinationContextRecordSchema (z.string().trim().min(1).nullable()) so the DB cannot
-- hold a state the application layer treats as impossible — including a custom row whose
-- label is empty or whitespace-only.
--
-- Note: migration 000007 is already live on Supabase cloud; this is an additive
-- constraint applied separately (no edit to the already-applied migration).

alter table public.divination_context
  add constraint divination_context_purpose_custom_coupling
  check (
    (purpose_key = 'custom' and purpose_custom is not null and length(btrim(purpose_custom)) > 0)
    or (purpose_key <> 'custom' and purpose_custom is null)
  );

-- rollback note:
-- drop the constraint to revert:
--   alter table public.divination_context drop constraint divination_context_purpose_custom_coupling;

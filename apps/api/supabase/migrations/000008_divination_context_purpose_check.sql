-- US-025/US-026 follow-up (PR #38 review): enforce the purpose_key / purpose_custom
-- coupling at the database layer. The free-text label is valid only for the 'custom'
-- preset; every other purpose_key must leave purpose_custom NULL. This mirrors the
-- contracts superRefine on divinationContextRecordSchema so the DB cannot hold a state
-- the application layer treats as impossible.
--
-- Note: migration 000007 is already live on Supabase cloud; this is an additive
-- constraint applied separately (no edit to the already-applied migration).

alter table public.divination_context
  add constraint divination_context_purpose_custom_coupling
  check (
    (purpose_key = 'custom' and purpose_custom is not null)
    or (purpose_key <> 'custom' and purpose_custom is null)
  );

-- rollback note:
-- drop the constraint to revert:
--   alter table public.divination_context drop constraint divination_context_purpose_custom_coupling;

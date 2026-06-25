-- Tighten every owner-scoped RLS policy in the public schema to the
-- `authenticated` role. Previously these policies were created without a
-- TO clause, so they applied to the implicit `public` grantee (which includes
-- the `anon` role). Supabase anonymous sign-ins still carry the `authenticated`
-- Postgres role and a real auth.uid(), so scoping to `authenticated` does not
-- change behavior for signed-in or anonymous-session users; it only removes the
-- truly session-less `anon`/`public` grantee from the policy surface. The
-- USING / WITH CHECK predicates (auth.uid() = owner_user_id) are left untouched.
-- Note: the `auth_allow_anonymous_sign_ins` advisor warning persists by design
-- because anonymous-session users hold the `authenticated` role; clearing it
-- would require blocking anonymous users and break anonymous chart creation.
-- See docs/decisions/0020-rls-authenticated-role.md.

-- profiles
alter policy "profiles_owner_select" on public.profiles to authenticated;
alter policy "profiles_owner_insert" on public.profiles to authenticated;
alter policy "profiles_owner_update" on public.profiles to authenticated;
alter policy "profiles_owner_delete" on public.profiles to authenticated;

-- birth_profiles
alter policy "birth_profiles_owner_select" on public.birth_profiles to authenticated;
alter policy "birth_profiles_owner_insert" on public.birth_profiles to authenticated;
alter policy "birth_profiles_owner_update" on public.birth_profiles to authenticated;
alter policy "birth_profiles_owner_delete" on public.birth_profiles to authenticated;

-- chart_snapshots
alter policy "chart_snapshots_owner_select" on public.chart_snapshots to authenticated;
alter policy "chart_snapshots_owner_insert" on public.chart_snapshots to authenticated;
alter policy "chart_snapshots_owner_update" on public.chart_snapshots to authenticated;
alter policy "chart_snapshots_owner_delete" on public.chart_snapshots to authenticated;

-- explanation_requests
alter policy "explanation_requests_owner_select" on public.explanation_requests to authenticated;
alter policy "explanation_requests_owner_insert" on public.explanation_requests to authenticated;
alter policy "explanation_requests_owner_update" on public.explanation_requests to authenticated;
alter policy "explanation_requests_owner_delete" on public.explanation_requests to authenticated;

-- explanation_results
alter policy "explanation_results_owner_select" on public.explanation_results to authenticated;
alter policy "explanation_results_owner_insert" on public.explanation_results to authenticated;
alter policy "explanation_results_owner_update" on public.explanation_results to authenticated;
alter policy "explanation_results_owner_delete" on public.explanation_results to authenticated;

-- history_views
alter policy "history_views_owner_select" on public.history_views to authenticated;
alter policy "history_views_owner_insert" on public.history_views to authenticated;
alter policy "history_views_owner_update" on public.history_views to authenticated;
alter policy "history_views_owner_delete" on public.history_views to authenticated;

-- annual_reports (single ALL policy)
alter policy "annual_reports_owner_only" on public.annual_reports to authenticated;

-- conversations
alter policy "conversations_owner_select" on public.conversations to authenticated;
alter policy "conversations_owner_insert" on public.conversations to authenticated;
alter policy "conversations_owner_update" on public.conversations to authenticated;
alter policy "conversations_owner_delete" on public.conversations to authenticated;

-- conversation_messages
alter policy "conversation_messages_owner_select" on public.conversation_messages to authenticated;
alter policy "conversation_messages_owner_insert" on public.conversation_messages to authenticated;
alter policy "conversation_messages_owner_update" on public.conversation_messages to authenticated;
alter policy "conversation_messages_owner_delete" on public.conversation_messages to authenticated;

-- rollback note:
-- to revert, run `alter policy <name> on <table> to public;` for each policy above.

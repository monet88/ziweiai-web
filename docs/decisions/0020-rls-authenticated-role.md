# 0020 Scope owner RLS policies to the authenticated role

Date: 2026-06-25

## Status

Accepted

## Context

Every owner-scoped table in the `public` schema (`profiles`, `birth_profiles`,
`chart_snapshots`, `explanation_requests`, `explanation_results`,
`history_views`, `annual_reports`, and the new `conversations` /
`conversation_messages`) was created with RLS policies that used
`auth.uid() = owner_user_id` but no `TO` clause. Without a `TO` clause a policy
applies to the implicit `public` grantee, which includes the session-less `anon`
role. The Supabase security advisor flags this as
`auth_allow_anonymous_sign_ins` ("Anonymous Access Policies").

This app uses Supabase anonymous sign-ins. An anonymous session still carries
the `authenticated` Postgres role and a real `auth.uid()`, so the predicate
already scopes rows correctly for both signed-in and anonymous-session users.
The only grantee the missing `TO` clause additionally exposed was the truly
session-less `public`/`anon` role, whose `auth.uid()` is NULL and therefore
already matched no rows.

Note: the advisor warning itself does **not** clear after this change, and that
was verified live. Because anonymous-session users hold the `authenticated`
role, the `auth_allow_anonymous_sign_ins` lint flags every owner table reachable
by `authenticated` while anonymous sign-ins are enabled. Suppressing the warning
would require blocking anonymous users, which would break the product's
anonymous chart-creation flow. The warning is therefore accepted as expected.

## Decision

Add `TO authenticated` to every owner-scoped policy in the `public` schema via
migration `000006_rls_tighten_authenticated.sql`. This becomes the convention:
new owner-scoped policies must specify `TO authenticated` alongside the
`auth.uid() = owner_user_id` predicate (per the Supabase security checklist:
`TO authenticated` for the role + an ownership predicate in `USING` /
`WITH CHECK`).

## Alternatives Considered

1. Leave policies on the implicit `public` grantee and dismiss the advisor
   warning. Rejected: keeps the `anon` role on the policy surface as
   defense-in-depth gap and leaves a standing advisor warning.
2. Rewrite predicates to wrap `auth.uid()` in a subselect for performance.
   Out of scope here; this change is role-scoping only and does not touch the
   `USING` / `WITH CHECK` expressions.

## Consequences

Positive:

- Removes the session-less `public`/`anon` grantee from every owner policy
  surface as defense-in-depth.
- Establishes one explicit RLS convention for the repo.
- No behavioral change for signed-in or anonymous-session users (both hold the
  `authenticated` role).

Tradeoffs:

- The `auth_allow_anonymous_sign_ins` advisor warning remains (expected: anon
  sign-ins are a product requirement; see Context).
- Future owner-scoped policies must remember the `TO authenticated` clause to
  stay consistent.

## Follow-Up

- New migrations that add owner-scoped tables must include `TO authenticated`.

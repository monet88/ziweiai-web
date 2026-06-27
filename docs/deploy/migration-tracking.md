# Supabase Migration Tracking

## Problem

Migrations applied to Supabase Cloud through the Management API (the
`/v1/projects/<ref>/database/query` endpoint or the dashboard SQL editor) do NOT
write a row into `supabase_migrations.schema_migrations`. Only the Supabase CLI
(`supabase db push` / `supabase migration up`) records the applied version.

The result is drift: the SQL ran on the cloud database, but
`supabase migration list --linked` still shows the version as not-applied. The
next CLI push can then try to re-run an already-applied migration, or an audit
wrongly reports the cloud as behind.

## Canonical apply path

Apply every migration through the CLI so the version is recorded automatically:

```bash
# from repo root, with the project linked (supabase link --project-ref <ref>)
supabase db push
# or a single pending file
supabase migration up --linked
```

Do NOT paste migration SQL into the dashboard SQL editor or call the Management
API query endpoint for schema changes that live under
`apps/api/supabase/migrations/`. That path skips version tracking.

## When the Management API was already used (backfill)

If a migration was applied out-of-band (Management API, dashboard, or a manual
`psql` session) and `schema_migrations` is missing the row, insert the matching
row manually so the ledger matches reality. The version is the numeric prefix of
the migration filename (for example `000010_vision-image-path-owner-check.sql`
has version `000010`).

```sql
-- Run against the cloud database. Replace <version> with the file's numeric prefix.
insert into supabase_migrations.schema_migrations (version, name)
values ('<version>', '<migration-file-name-without-extension>')
on conflict (version) do nothing;
```

Then confirm the ledger is consistent:

```bash
supabase migration list --linked
```

Every file under `apps/api/supabase/migrations/` should appear as applied, with
no extra or missing versions.

## Verification checklist

- `supabase migration list --linked` shows local and remote columns aligned.
- The count of applied versions equals the number of files in
  `apps/api/supabase/migrations/`.
- No migration file was applied via the dashboard/Management API without a
  matching `schema_migrations` row.

## Reference

- Deploy guide: `docs/deploy/aws-lightsail.md`
- Cloud environment decision: `docs/decisions/0016-supabase-cloud-environment.md`

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
  __dirname,
  '../../supabase/migrations/000001_user-owned-astrology-records.sql',
);
const migration = readFileSync(migrationPath, 'utf8');

describe('phase 4 persistence migration', () => {
  it('creates the required user-owned tables', () => {
    expect(migration).toContain('create table if not exists public.profiles');
    expect(migration).toContain('create table if not exists public.birth_profiles');
    expect(migration).toContain('create table if not exists public.chart_snapshots');
    expect(migration).toContain('create table if not exists public.explanation_requests');
    expect(migration).toContain('create table if not exists public.explanation_results');
    expect(migration).toContain('create table if not exists public.history_views');
  });

  it('enables RLS on all sensitive tables', () => {
    expect(migration).toContain('alter table public.birth_profiles enable row level security;');
    expect(migration).toContain('alter table public.chart_snapshots enable row level security;');
    expect(migration).toContain('alter table public.explanation_requests enable row level security;');
    expect(migration).toContain('alter table public.explanation_results enable row level security;');
    expect(migration).toContain('alter table public.history_views enable row level security;');
  });

  it('adds dedupe uniqueness for chart and explanation retries', () => {
    expect(migration).toContain('chart_snapshots_owner_dedupe_idx');
    expect(migration).toContain('explanation_requests_owner_idempotency_idx');
  });

  it('keeps personalized cache scope user-bound', () => {
    expect(migration).toContain("cache_scope text not null default 'user_snapshot'");
    expect(migration).not.toContain("default 'shared'");
  });
});

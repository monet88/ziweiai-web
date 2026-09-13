import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Migration 000041: Safe Canonicalization & Deduplication', () => {
  const migrationPath = resolve(
    __dirname,
    '../../supabase/migrations/000041_fix_welcome_bonus_canonicalization_and_dedup.sql',
  );
  const migration = readFileSync(migrationPath, 'utf8');

  it('drops the unique index before updating to avoid duplicate key violations', () => {
    const dropIndexPos = migration.indexOf('drop index if exists public.welcome_bonus_claims_normalized_email_idx');
    const updatePos = migration.indexOf('update public.welcome_bonus_claims');
    const createIndexPos = migration.indexOf('create unique index if not exists welcome_bonus_claims_normalized_email_idx');

    expect(dropIndexPos).toBeGreaterThan(-1);
    expect(updatePos).toBeGreaterThan(-1);
    expect(createIndexPos).toBeGreaterThan(-1);

    // Bắt buộc: DROP INDEX -> UPDATE -> DEDUPLICATE -> CREATE UNIQUE INDEX
    expect(dropIndexPos).toBeLessThan(updatePos);
    expect(updatePos).toBeLessThan(createIndexPos);
  });

  it('performs safe deduplication using CTE and row_number', () => {
    expect(migration).toContain('row_number() over');
    expect(migration).toContain('partition by normalized_email');
    expect(migration).toContain('delete from public.welcome_bonus_claims');
    expect(migration).toContain('where ctid in');
  });

  it('canonicalizes gmail and googlemail addresses without dots or alias tags', () => {
    expect(migration).toContain("split_part(v_local, '+', 1)");
    expect(migration).toContain("replace(v_local, '.', '')");
  });
});

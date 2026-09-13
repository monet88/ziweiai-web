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

  it('performs safe deduplication with exact recoverable clawback and audit memo', () => {
    expect(migration).toContain('row_number() over');
    expect(migration).toContain('partition by normalized_email');
    expect(migration).toContain('delete from public.welcome_bonus_claims');
    expect(migration).toContain('where ctid = r.ctid');
    expect(migration).toContain('insert into public.xu_transactions');
    expect(migration).toContain("'welcome_bonus_duplicate_reversal'");
    expect(migration).toContain("'welcome_bonus_duplicate_unrecoverable_consumed'");
    expect(migration).toContain('least(greatest(0, v_current_balance), r.reward_xu)');
    expect(migration).toContain('xu_balance = xu_balance - v_recoverable_xu');
  });

  it('canonicalizes gmail and googlemail addresses without dots or alias tags', () => {
    expect(migration).toContain("split_part(v_local, '+', 1)");
    expect(migration).toContain("replace(v_local, '.', '')");
  });

  describe('Accounting Invariant Reconciliation Simulation', () => {
    function simulateReconciliation(initialBalance: number, bonusAwarded: number, priorSpending: number) {
      // Bắt đầu với balance ban đầu
      let balance = initialBalance;
      const ledger: Array<{ amount: number; type: string }> = [
        { amount: bonusAwarded, type: 'welcome_bonus' },
      ];

      if (priorSpending > 0) {
        ledger.push({ amount: -priorSpending, type: 'ai_usage' });
        balance -= priorSpending;
      }

      // Thuật toán của Migration 000041:
      const recoverable = Math.min(Math.max(0, balance), bonusAwarded);
      const unrecoverable = bonusAwarded - recoverable;

      if (recoverable > 0) {
        ledger.push({ amount: -recoverable, type: 'welcome_bonus_duplicate_reversal' });
        balance -= recoverable;
      }

      if (unrecoverable > 0) {
        ledger.push({ amount: 0, type: 'welcome_bonus_duplicate_unrecoverable_consumed' });
      }

      const totalLedger = ledger.reduce((sum, tx) => sum + tx.amount, 0);

      return {
        finalBalance: balance,
        totalLedger,
        recoverable,
        unrecoverable,
        isConsistent: balance === totalLedger,
      };
    }

    it('Case 1: User has not spent any bonus (balance = 15) -> 100% recovered, invariant holds', () => {
      const result = simulateReconciliation(15, 15, 0);
      expect(result.recoverable).toBe(15);
      expect(result.unrecoverable).toBe(0);
      expect(result.finalBalance).toBe(0);
      expect(result.totalLedger).toBe(0);
      expect(result.isConsistent).toBe(true);
    });

    it('Case 2: User spent 5 XU (balance = 10) -> 10 recovered, 5 bad-debt memo, invariant holds', () => {
      const result = simulateReconciliation(15, 15, 5);
      expect(result.recoverable).toBe(10);
      expect(result.unrecoverable).toBe(5);
      expect(result.finalBalance).toBe(0);
      expect(result.totalLedger).toBe(0);
      expect(result.isConsistent).toBe(true);
    });

    it('Case 3: User spent all 15 XU (balance = 0) -> 0 recovered, 15 bad-debt memo, invariant holds', () => {
      const result = simulateReconciliation(15, 15, 15);
      expect(result.recoverable).toBe(0);
      expect(result.unrecoverable).toBe(15);
      expect(result.finalBalance).toBe(0);
      expect(result.totalLedger).toBe(0);
      expect(result.isConsistent).toBe(true);
    });

    it('Case 4: User topped up after bonus (balance = 65) -> 15 recovered, 50 remains, invariant holds', () => {
      // 15 bonus + 50 topup = 65
      let balance = 65;
      const ledger = [
        { amount: 15, type: 'welcome_bonus' },
        { amount: 50, type: 'sepay_topup' },
      ];
      const bonusAwarded = 15;
      const recoverable = Math.min(Math.max(0, balance), bonusAwarded);
      ledger.push({ amount: -recoverable, type: 'welcome_bonus_duplicate_reversal' });
      balance -= recoverable;

      const totalLedger = ledger.reduce((sum, tx) => sum + tx.amount, 0);
      expect(recoverable).toBe(15);
      expect(balance).toBe(50);
      expect(totalLedger).toBe(50);
      expect(balance === totalLedger).toBe(true);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  SEPAY_BANKS,
  SEPAY_BANK_ACB,
  getDefaultBank
} from './bank-config';

describe('bank-config', () => {
  it('defines ACB as the canonical single SePay bank account', () => {
    expect(SEPAY_BANKS).toHaveLength(1);

    const acb = SEPAY_BANKS[0];
    expect(acb.id).toBe('acb');
    expect(acb.bankCode).toBe('ACB');
    expect(acb.accountNo).toBe('6384251098');
    expect(acb.accountName).toBe('tuvi');
    expect(SEPAY_BANK_ACB.accountNo).toBe('6384251098');
  });

  it('returns ACB as the default bank', () => {
    const def = getDefaultBank();
    expect(def.id).toBe('acb');
    expect(def.bankCode).toBe('ACB');
    expect(def.accountNo).toBe('6384251098');
    expect(def.accountName).toBe('tuvi');
  });

  it('respects account override when provided', () => {
    const custom = getDefaultBank('6384251099');
    expect(custom.id).toBe('acb');
    expect(custom.accountNo).toBe('6384251099');
    expect(custom.accountName).toBe('tuvi');
  });
});

import { describe, it, expect } from 'vitest';
import {
  SEPAY_BANKS,
  SEPAY_BANK_TPBANK,
  SEPAY_BANK_ACB,
  getDefaultBank
} from './bank-config';

describe('bank-config', () => {
  it('defines TPBank as canonical primary and ACB as fallback', () => {
    expect(SEPAY_BANKS).toHaveLength(2);

    const tpbank = SEPAY_BANKS[0];
    expect(tpbank.id).toBe('tpbank');
    expect(tpbank.bankCode).toBe('TPBank');
    expect(tpbank.accountNo).toBe('36889338888');
    expect(tpbank.accountName).toBe('LE VAN TINH');
    expect(SEPAY_BANK_TPBANK.accountNo).toBe('36889338888');

    const acb = SEPAY_BANKS[1];
    expect(acb.id).toBe('acb');
    expect(acb.bankCode).toBe('ACB');
    expect(acb.accountNo).toBe('6384251098');
    expect(SEPAY_BANK_ACB.accountNo).toBe('6384251098');
  });

  it('returns TPBank as the default bank', () => {
    const def = getDefaultBank();
    expect(def.id).toBe('tpbank');
    expect(def.bankCode).toBe('TPBank');
    expect(def.accountNo).toBe('36889338888');
    expect(def.accountName).toBe('LE VAN TINH');
  });

  it('respects account and bank overrides when provided', () => {
    const custom = getDefaultBank('36889339999', 'ACB', 'TEST OVERRIDE');
    expect(custom.accountNo).toBe('36889339999');
    expect(custom.bankCode).toBe('ACB');
    expect(custom.accountName).toBe('TEST OVERRIDE');
  });

  it('rejects legacy ACB test account 6384251098 and falls back to TPBank official account', () => {
    const guarded = getDefaultBank('6384251098', 'TPBank', 'LE VAN TINH');
    expect(guarded.accountNo).toBe('36889338888');
    expect(guarded.bankCode).toBe('TPBank');
    expect(guarded.accountName).toBe('LE VAN TINH');
  });
});

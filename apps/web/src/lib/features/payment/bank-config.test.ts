import { describe, it, expect } from 'vitest';
import {
  SEPAY_BANKS,
  getDefaultBank
} from './bank-config';

describe('bank-config', () => {
  it('defines ACB and Vietcombank matching SePay bank accounts', () => {
    expect(SEPAY_BANKS).toHaveLength(2);

    const acb = SEPAY_BANKS.find((b) => b.id === 'acb');
    expect(acb).toBeDefined();
    expect(acb?.bankCode).toBe('ACB');
    expect(acb?.accountNo).toBe('6384251098');
    expect(acb?.accountName).toBe('tuvi');

    const vcb = SEPAY_BANKS.find((b) => b.id === 'vcb');
    expect(vcb).toBeDefined();
    expect(vcb?.bankCode).toBe('Vietcombank');
    expect(vcb?.accountNo).toBe('0000000001');
    expect(vcb?.accountName).toBe('Lê David');
  });

  it('returns ACB as the default bank', () => {
    const def = getDefaultBank();
    expect(def.id).toBe('acb');
    expect(def.bankCode).toBe('ACB');
    expect(def.accountNo).toBe('6384251098');
    expect(def.accountName).toBe('tuvi');
  });

  it('respects bank and account overrides when valid', () => {
    const custom = getDefaultBank('Vietcombank', '0000000002');
    expect(custom.id).toBe('vcb');
    expect(custom.accountNo).toBe('0000000002');
    expect(custom.accountName).toBe('Lê David');
  });

  it('falls back to default when overrides are incomplete or invalid', () => {
    const fallback1 = getDefaultBank(undefined, '123456');
    expect(fallback1.id).toBe('acb');

    const fallback2 = getDefaultBank('UnknownBank', '123456');
    expect(fallback2.id).toBe('acb');
  });
});

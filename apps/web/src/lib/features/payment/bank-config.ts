export interface SepayBankAccount {
  id: 'tpbank' | 'acb';
  bankCode: string; // Used by SePay VietQR URL generator: 'TPBank' | 'ACB'
  shortName: string;
  fullName: string;
  accountNo: string;
  accountName: string;
  badge?: string;
}

export const SEPAY_BANK_TPBANK: SepayBankAccount = {
  id: 'tpbank',
  bankCode: 'TPBank',
  shortName: 'TPBank',
  fullName: 'Ngân hàng TMCP Tiên Phong (TPBank)',
  accountNo: '36889338888',
  accountName: 'LE VAN TINH',
  badge: 'Chính Thức 24/7'
};

export const SEPAY_BANK_ACB: SepayBankAccount = {
  id: 'acb',
  bankCode: 'ACB',
  shortName: 'ACB',
  fullName: 'Ngân hàng TMCP Á Châu (ACB)',
  accountNo: '6384251098',
  accountName: 'tuvi',
  badge: 'Test Mode'
};

export const SEPAY_BANKS: SepayBankAccount[] = [SEPAY_BANK_TPBANK, SEPAY_BANK_ACB];

export const LEGACY_TEST_ACCOUNT = '6384251098';

export function getDefaultBank(
  accountOverride?: string,
  bankOverride?: string,
  accountNameOverride?: string
): SepayBankAccount {
  const base = SEPAY_BANK_TPBANK;

  // Sanitization guard: If accountOverride is the legacy testmode account '6384251098',
  // or empty/undefined, always fallback to canonical TPBank account 36889338888.
  const isLegacyTestAccount = accountOverride === LEGACY_TEST_ACCOUNT;
  const safeAccount = (accountOverride && !isLegacyTestAccount) ? accountOverride : base.accountNo;
  const safeBank = bankOverride || base.bankCode;
  const safeName = accountNameOverride || base.accountName;

  return {
    ...base,
    accountNo: safeAccount,
    bankCode: safeBank,
    accountName: safeName
  };
}


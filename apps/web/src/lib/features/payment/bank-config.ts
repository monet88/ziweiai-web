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

export function getDefaultBank(
  accountOverride?: string,
  bankOverride?: string,
  accountNameOverride?: string
): SepayBankAccount {
  const base = SEPAY_BANK_TPBANK;
  return {
    ...base,
    accountNo: accountOverride || base.accountNo,
    bankCode: bankOverride || base.bankCode,
    accountName: accountNameOverride || base.accountName
  };
}


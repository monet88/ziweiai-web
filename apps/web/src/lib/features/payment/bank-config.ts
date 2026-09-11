export interface SepayBankAccount {
  id: 'acb';
  bankCode: string; // Used by SePay VietQR URL generator: 'ACB'
  shortName: string;
  fullName: string;
  accountNo: string;
  accountName: string;
  badge?: string;
}

export const SEPAY_BANK_ACB: SepayBankAccount = {
  id: 'acb',
  bankCode: 'ACB',
  shortName: 'ACB',
  fullName: 'Ngân hàng TMCP Á Châu (ACB)',
  accountNo: '6384251098',
  accountName: 'tuvi',
  badge: 'Nhanh 24/7'
};

export const SEPAY_BANKS: SepayBankAccount[] = [SEPAY_BANK_ACB];

export function getDefaultBank(accountOverride?: string): SepayBankAccount {
  if (accountOverride) {
    return { ...SEPAY_BANK_ACB, accountNo: accountOverride };
  }
  return SEPAY_BANK_ACB;
}


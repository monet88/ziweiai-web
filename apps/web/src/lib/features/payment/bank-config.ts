export interface SepayBankAccount {
  id: 'acb' | 'vcb';
  bankCode: string; // Used by SePay VietQR URL generator: 'ACB' | 'Vietcombank'
  shortName: string;
  fullName: string;
  accountNo: string;
  accountName: string;
  badge?: string;
}

export const SEPAY_BANKS: SepayBankAccount[] = [
  {
    id: 'acb',
    bankCode: 'ACB',
    shortName: 'ACB',
    fullName: 'Ngân hàng TMCP Á Châu (ACB)',
    accountNo: '6384251098',
    accountName: 'tuvi',
    badge: 'Nhanh 24/7'
  },
  {
    id: 'vcb',
    bankCode: 'Vietcombank',
    shortName: 'Vietcombank',
    fullName: 'Ngân hàng Ngoại thương (VCB)',
    accountNo: '0000000001',
    accountName: 'Lê David',
    badge: 'Phổ biến'
  }
];

export function getDefaultBank(bankOverride?: string, accountOverride?: string): SepayBankAccount {
  if (bankOverride && accountOverride) {
    const matched = SEPAY_BANKS.find(
      (b) =>
        b.bankCode.toLowerCase() === bankOverride.toLowerCase() ||
        b.shortName.toLowerCase() === bankOverride.toLowerCase()
    );
    if (matched) {
      return { ...matched, accountNo: accountOverride };
    }
  }
  return SEPAY_BANKS[0];
}

export interface PaywallOptions {
  message?: string;
  featureName?: string;
  requiredXu?: number;
  suggestedPackageXu?: number;
}

class PaywallStore {
  isOpen = $state(false);
  message = $state('');
  featureName = $state('Tính năng Hoàng Gia');
  requiredXu = $state(50);
  suggestedPackageXu = $state(50);

  open(optionsOrMessage: string | PaywallOptions = {}) {
    if (typeof optionsOrMessage === 'string') {
      this.message = optionsOrMessage;
      this.featureName = 'Tính năng Hoàng Gia';
      this.requiredXu = 50;
      this.suggestedPackageXu = 50;
    } else {
      this.message = optionsOrMessage.message || '';
      this.featureName = optionsOrMessage.featureName || 'Tính năng Hoàng Gia';
      this.requiredXu = optionsOrMessage.requiredXu || 50;
      this.suggestedPackageXu = optionsOrMessage.suggestedPackageXu || 50;
    }
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
    this.message = '';
  }
}

export const paywallStore = new PaywallStore();

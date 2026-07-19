class PaywallStore {
  isOpen = $state(false);
  message = $state('');

  open(message: string) {
    this.message = message;
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
    this.message = '';
  }
}

export const paywallStore = new PaywallStore();

export function createAuthModalStore() {
  let isOpen = $state(false);
  let message = $state<string | undefined>();

  return {
    get isOpen() { return isOpen; },
    get message() { return message; },
    open(msg?: string) {
      message = msg;
      isOpen = true;
    },
    close() {
      isOpen = false;
      message = undefined;
    }
  };
}

export const authModalStore = createAuthModalStore();

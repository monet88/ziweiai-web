import { setContext, getContext } from 'svelte';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { createWalletModel } from './wallet-model.svelte';

const WALLET_CONTEXT_KEY = Symbol('WALLET_CONTEXT');

export type WalletStore = ReturnType<typeof createWalletModel>;

export function setWalletStore(auth: AuthStore): WalletStore {
  const wallet = createWalletModel(auth);
  setContext(WALLET_CONTEXT_KEY, wallet);
  return wallet;
}

export function getWalletStore(): WalletStore {
  const wallet = getContext<WalletStore>(WALLET_CONTEXT_KEY);
  if (!wallet) {
    throw new Error('walletStore has not been initialized. Did you call setWalletStore?');
  }
  return wallet;
}

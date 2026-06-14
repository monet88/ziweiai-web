/**
 * Cấp/đọc AuthStore qua Svelte context (thay useContext của React).
 * Provide ở +layout.svelte root, consume ở mọi component con + guard.
 */
import { getContext, setContext } from 'svelte';
import { AuthStore } from './auth-store.svelte';

const AUTH_KEY = Symbol('auth');

export function setAuthStore(store: AuthStore): AuthStore {
  return setContext(AUTH_KEY, store);
}

export function getAuthStore(): AuthStore {
  const store = getContext<AuthStore | undefined>(AUTH_KEY);
  if (!store) {
    throw new Error('getAuthStore phải được gọi bên trong cây có setAuthStore (layout root).');
  }
  return store;
}

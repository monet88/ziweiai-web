import { fetchNoContent } from './fetch-json';

export function deleteAccount(token: string): Promise<void> {
  return fetchNoContent('/users/me', { method: 'DELETE', token });
}

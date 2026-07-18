import { assertOwnedByUser } from '../../../database/ownership';

export function assertUserOwnedRecordScope(authenticatedUserId: string, ownerUserId: string): void {
  assertOwnedByUser(authenticatedUserId, ownerUserId);
}

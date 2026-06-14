export class OwnershipScopeError extends Error {
  constructor() {
    super('Authenticated user does not own this record.');
  }
}

export function canAccessOwnedRecord(authenticatedUserId: string, ownerUserId: string): boolean {
  return authenticatedUserId === ownerUserId;
}

export function assertOwnedByUser(authenticatedUserId: string, ownerUserId: string): void {
  if (!canAccessOwnedRecord(authenticatedUserId, ownerUserId)) {
    throw new OwnershipScopeError();
  }
}

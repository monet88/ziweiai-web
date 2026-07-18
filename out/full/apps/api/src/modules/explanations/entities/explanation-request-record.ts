export const EXPLANATION_REQUEST_TABLE = {
  name: 'explanation_requests',
  ownerColumn: 'owner_user_id',
  idempotencyColumn: 'idempotency_key',
} as const;

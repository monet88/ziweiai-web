export const CHART_SNAPSHOT_TABLE = {
  name: 'chart_snapshots',
  ownerColumn: 'owner_user_id',
  idempotencyColumn: 'snapshot_dedupe_key',
} as const;

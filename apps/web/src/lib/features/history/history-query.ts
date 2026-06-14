export function buildHistoryQueryKey(userId: string, limit: number) {
  return ['history', userId, limit] as const;
}

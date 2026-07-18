export function normalizePostgresTimestamp(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Postgres/Supabase có thể trả timestamptz với microsecond, ví dụ:
  //   2026-06-07 11:17:21.337456+00
  // Không parse qua JS Date cho case UTC vì Date chỉ giữ millisecond, làm mất .000456.
  // CAS theo updated_at cần chuỗi giữ nguyên precision để .eq('updated_at', expectedUpdatedAt) không fail giả.
  const utcTimestamp = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?(?:\+00(?::?00)?|Z)$/);
  if (utcTimestamp) {
    const [, date, time, fraction = ''] = utcTimestamp;
    return `${date}T${time}${fraction}Z`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
}

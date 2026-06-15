// Gộp lịch sử view thành danh sách lá số duy nhất cho sidebar dashboard.
//
// /history (GET /history?limit=N) trả MỘT view cho mỗi lần xem: tạo lá số, mỗi lần luận
// giải... → nhiều view có thể trỏ cùng một chartRecord.id. Nếu render trực tiếp, danh sách
// vừa lặp một lá số nhiều lần, vừa gây each_key_duplicate khi key theo chartRecord.id.
//
// Hàm thuần (không phụ thuộc DOM/i18n) để unit-test được kịch bản trùng view:
//   - chỉ giữ view có chartRecord (id thật để điều hướng tới /charts/[id]);
//   - gộp các view cùng chartRecord.id về MỘT mục, giữ view ĐẦU (history sort viewedAt desc
//     = mới nhất) làm metadata hiển thị;
//   - bật hasExplanation nếu BẤT KỲ view nào của lá số đó có explanationResult.
import type { HistoryListResponse } from '@ziweiai/contracts';

type HistoryItem = HistoryListResponse['items'][number];
type ChartRecord = NonNullable<HistoryItem['chartRecord']>;

export interface DashboardChartHistoryEntry {
  chartRecord: ChartRecord;
  hasExplanation: boolean;
}

/**
 * Gộp các view lịch sử về danh sách lá số duy nhất (dedupe theo chartRecord.id), giữ thứ tự
 * xuất hiện đầu tiên. Trả về chartRecord gốc + cờ hasExplanation đã gộp; component tự map nhãn.
 */
export function dedupeHistoryChartEntries(
  items: readonly HistoryItem[],
): DashboardChartHistoryEntry[] {
  const indexByChartId: Record<string, number> = {};
  const entries: DashboardChartHistoryEntry[] = [];

  for (const item of items) {
    if (item.chartRecord === null) {
      continue;
    }
    const record = item.chartRecord;
    const existingIndex = indexByChartId[record.id];
    if (existingIndex !== undefined) {
      entries[existingIndex].hasExplanation =
        entries[existingIndex].hasExplanation || item.explanationResult !== null;
      continue;
    }
    indexByChartId[record.id] = entries.length;
    entries.push({ chartRecord: record, hasExplanation: item.explanationResult !== null });
  }

  return entries;
}

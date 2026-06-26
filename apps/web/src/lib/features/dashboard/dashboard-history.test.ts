// Hồi quy each_key_duplicate (phát hiện khi làm E2E US-006): /history trả NHIỀU view cùng một
// lá số (1 view tạo lá số + N view mỗi lần luận giải) → trước đây sidebar key theo chartRecord.id
// bị trùng + lặp lá số. dedupeHistoryChartEntries phải gộp về MỘT mục/lá số, giữ thứ tự đầu,
// bật hasExplanation nếu bất kỳ view nào có luận giải, và bỏ view không có chartRecord.
import { describe, expect, it } from 'vitest';
import type { HistoryListResponse } from '@ziweiai/contracts';
import { collectVisionHistoryEntries, dedupeHistoryChartEntries } from './dashboard-history';

type HistoryItem = HistoryListResponse['items'][number];

// Dựng một view tối thiểu: hàm thuần chỉ đọc chartRecord (id + chartSystem + createdAt) và
// explanationResult (null?). Cast qua unknown để tránh dựng toàn bộ record contracts.
function makeView(options: {
  chartId: string | null;
  hasExplanation: boolean;
}): HistoryItem {
  const chartRecord =
    options.chartId === null
      ? null
      : {
          id: options.chartId,
          chartSystem: 'ziwei',
          createdAt: '2026-06-14T00:00:00.000Z',
        };
  return {
    view: { id: `view-${Math.random()}` },
    chartRecord,
    explanationResult: options.hasExplanation ? { id: 'expl' } : null,
  } as unknown as HistoryItem;
}

describe('dedupeHistoryChartEntries', () => {
  it('gộp nhiều view cùng chartRecord.id về MỘT mục (chống each_key_duplicate)', () => {
    const items = [
      makeView({ chartId: 'chart-a', hasExplanation: false }),
      makeView({ chartId: 'chart-a', hasExplanation: true }),
      makeView({ chartId: 'chart-a', hasExplanation: false }),
      makeView({ chartId: 'chart-b', hasExplanation: false }),
      makeView({ chartId: 'chart-b', hasExplanation: false }),
    ];

    const entries = dedupeHistoryChartEntries(items);

    expect(entries).toHaveLength(2);
    const ids = entries.map((entry) => entry.chartRecord.id);
    expect(ids).toEqual(['chart-a', 'chart-b']);
    // Key duy nhất sau dedupe (điều kiện sống còn để {#each (item.id)} không trùng).
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('bật hasExplanation nếu BẤT KỲ view nào của lá số có luận giải', () => {
    const items = [
      makeView({ chartId: 'chart-a', hasExplanation: false }),
      makeView({ chartId: 'chart-a', hasExplanation: true }),
    ];

    const entries = dedupeHistoryChartEntries(items);

    expect(entries).toHaveLength(1);
    expect(entries[0].hasExplanation).toBe(true);
  });

  it('giữ thứ tự xuất hiện đầu tiên của mỗi lá số', () => {
    const items = [
      makeView({ chartId: 'chart-b', hasExplanation: false }),
      makeView({ chartId: 'chart-a', hasExplanation: false }),
      makeView({ chartId: 'chart-b', hasExplanation: false }),
    ];

    const entries = dedupeHistoryChartEntries(items);

    expect(entries.map((entry) => entry.chartRecord.id)).toEqual(['chart-b', 'chart-a']);
  });

  it('bỏ view không có chartRecord (mục chỉ-luận-giải không điều hướng được)', () => {
    const items = [
      makeView({ chartId: null, hasExplanation: true }),
      makeView({ chartId: 'chart-a', hasExplanation: false }),
    ];

    const entries = dedupeHistoryChartEntries(items);

    expect(entries).toHaveLength(1);
    expect(entries[0].chartRecord.id).toBe('chart-a');
  });

  it('danh sách rỗng trả về mảng rỗng', () => {
    expect(dedupeHistoryChartEntries([])).toEqual([]);
  });
});

// Dựng view vision tối thiểu: collector chỉ đọc visionResult (id + question + ...) và
// visionImageUrl. chartRecord null vì view vision không gắn lá số (decision 0023).
function makeVisionView(options: {
  visionId: string;
  kind?: 'face' | 'palm';
  question?: string | null;
  imageUrl?: string | null;
}): HistoryItem {
  return {
    view: { id: `view-${Math.random()}` },
    chartRecord: null,
    explanationResult: null,
    visionResult: {
      id: options.visionId,
      kind: options.kind ?? 'palm',
      question: options.question ?? null,
      renderedMarkdown: 'Luận giải đã lưu.',
    },
    visionImageUrl: options.imageUrl ?? null,
  } as unknown as HistoryItem;
}

describe('collectVisionHistoryEntries', () => {
  it('giữ các view vision (chart null) mà dedupeHistoryChartEntries bỏ qua', () => {
    const items = [
      makeVisionView({ visionId: 'vision-a', kind: 'palm', imageUrl: 'https://signed/a.jpg' }),
      makeVisionView({ visionId: 'vision-b', kind: 'face', imageUrl: 'https://signed/b.jpg' }),
    ];

    const entries = collectVisionHistoryEntries(items);

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.visionResult.id)).toEqual(['vision-a', 'vision-b']);
    expect(entries[0].imageUrl).toBe('https://signed/a.jpg');
  });

  it('dedupe theo visionResult.id, giữ view xuất hiện đầu', () => {
    const items = [
      makeVisionView({ visionId: 'vision-a', imageUrl: 'https://signed/first.jpg' }),
      makeVisionView({ visionId: 'vision-a', imageUrl: 'https://signed/dup.jpg' }),
    ];

    const entries = collectVisionHistoryEntries(items);

    expect(entries).toHaveLength(1);
    expect(entries[0].imageUrl).toBe('https://signed/first.jpg');
  });

  it('giữ imageUrl null khi ký URL thất bại (ảnh hỏng không làm sập danh sách)', () => {
    const entries = collectVisionHistoryEntries([
      makeVisionView({ visionId: 'vision-a', imageUrl: null }),
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0].imageUrl).toBeNull();
  });

  it('bỏ qua các view không có visionResult (lá số/luận giải thuần)', () => {
    const items = [
      makeView({ chartId: 'chart-a', hasExplanation: true }),
      makeVisionView({ visionId: 'vision-a' }),
    ];

    const entries = collectVisionHistoryEntries(items);

    expect(entries).toHaveLength(1);
    expect(entries[0].visionResult.id).toBe('vision-a');
  });

  it('danh sách rỗng trả về mảng rỗng', () => {
    expect(collectVisionHistoryEntries([])).toEqual([]);
  });
});

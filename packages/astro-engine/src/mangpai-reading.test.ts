import { describe, expect, it } from 'vitest';
import { chartSnapshotSchema, mangpaiChartSchema, type BirthInput } from '@ziweiai/contracts';
import { MangpaiAdapter } from './adapters/mangpai-adapter';

// Đồng bộ guard CJK runtime: luận giải Mạnh Phái đã dịch tiếng Việt nên KHÔNG được rò ký tự CJK.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

function birth(year: number, month: number, day: number, hour: number, isUnknown = false): BirthInput {
  return {
    calendar: 'gregorian',
    date: { year, month, day, isLeapMonth: null },
    time: { hour: isUnknown ? null : hour, minute: isUnknown ? null : 0, isUnknown },
    sexOrGenderForChart: 'male',
    place: {
      label: 'Ho Chi Minh City',
      manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
    },
    locale: 'vi-VN',
    source: 'test-fixture',
  };
}

const adapter = new MangpaiAdapter();
const sample = birth(1990, 6, 15, 12);

describe('MangpaiAdapter (US-017d)', () => {
  it('trả snapshot hợp lệ với chartSystem=mangpai + khối mangpai theo schema', async () => {
    const snapshot = await adapter.calculateChart(sample);
    expect(chartSnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(snapshot.chartSystem).toBe('mangpai');
    expect(snapshot.ruleSource.system).toBe('mangpai');
    expect(snapshot.snapshotId.startsWith('mangpai-')).toBe(true);
    expect(snapshot.mangpai).toBeDefined();
    expect(mangpaiChartSchema.safeParse(snapshot.mangpai).success).toBe(true);
    // Vẫn giữ khối bazi (Mạnh Phái đặt trên Bát Tự) — nhật trụ phải khớp giữa hai khối.
    expect(snapshot.bazi).toBeDefined();
    expect(snapshot.mangpai?.dayPillarHeavenlyStemKey).toBe(snapshot.bazi?.pillars[2].heavenlyStemKey);
    expect(snapshot.mangpai?.dayPillarEarthlyBranchKey).toBe(snapshot.bazi?.pillars[2].earthlyBranchKey);
  });

  it('deterministic: cùng input → cùng khối mangpai', async () => {
    const a = await adapter.calculateChart(sample);
    const b = await adapter.calculateChart(sample);
    expect(a.mangpai).toEqual(b.mangpai);
  });

  it('không rò chữ Hán/CJK trong toàn bộ luận giải Mạnh Phái', async () => {
    for (const input of [birth(1988, 3, 22, 9), birth(1995, 11, 2, 23), birth(2001, 7, 9, 4)]) {
      const mangpai = (await adapter.calculateChart(input)).mangpai;
      expect(mangpai).toBeDefined();
      const texts = [
        mangpai!.title,
        mangpai!.narrative,
        ...mangpai!.insights.flatMap((insight) => [insight.heading, insight.detail]),
      ];
      for (const text of texts) {
        expect(CJK_TEXT_PATTERN.test(text), `output "${text}" không được chứa CJK`).toBe(false);
      }
    }
  });

  it('giờ sinh không xác định: kế thừa blocked snapshot của Bát Tự, KHÔNG bịa luận Mạnh Phái', async () => {
    const snapshot = await adapter.calculateChart(birth(1990, 6, 15, 12, true));
    // Bát Tự coi giờ không xác định là blocksExactReading → trả snapshot blocked, không dựng
    // khối bazi; Mạnh Phái kế thừa: KHÔNG cố luận trên dữ liệu thiếu. Snapshot vẫn hợp lệ +
    // mang đúng chartSystem=mangpai để tầng trên xử lý nhất quán.
    expect(chartSnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(snapshot.chartSystem).toBe('mangpai');
    expect(snapshot.summary).toEqual({ status: 'blocked', reason: expect.any(String) });
    expect(snapshot.mangpai).toBeUndefined();
  });
});

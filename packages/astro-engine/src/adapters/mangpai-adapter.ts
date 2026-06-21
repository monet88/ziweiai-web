import { type BirthInput, type ChartSnapshot } from '@ziweiai/contracts';
import { analyzeMangpaiReading } from '../mangpai-reading';
import { LunarJavascriptBaziAdapter } from './lunar-javascript-bazi-adapter';
import type { AstrologyChartAdapter, ChartCalculationOptions } from './astro-adapter';

// Mạnh Phái (US-017d, decision 0012): KHÔNG có engine riêng — nó là lớp luận giải đặt trên Bát
// Tự. Adapter này tái dùng LunarJavascriptBaziAdapter để dựng tứ trụ rồi gắn thêm khối `mangpai`
// (luận giải tiếng Việt deterministic) và đổi `chartSystem` thành 'mangpai'. Cách soạn-trên này
// tránh nhân bản logic tính can-chi và tự kế thừa xử lý ngày sinh bị chặn (blocked snapshot).
export class MangpaiAdapter implements AstrologyChartAdapter {
  readonly system = 'mangpai' as const;
  readonly adapterName = 'lunar-javascript+mangpai';
  readonly adapterVersion = '1.7.7';
  readonly usesViewYear = false;

  private readonly baziAdapter = new LunarJavascriptBaziAdapter();

  async calculateChart(input: BirthInput, options?: ChartCalculationOptions): Promise<ChartSnapshot> {
    const baziSnapshot = await this.baziAdapter.calculateChart(input, options);
    const snapshot: ChartSnapshot = {
      ...baziSnapshot,
      chartSystem: 'mangpai',
      snapshotId: baziSnapshot.snapshotId.replace(/^ba-zi-/, 'mangpai-'),
      ruleSource: { ...baziSnapshot.ruleSource, system: 'mangpai' },
    };

    // Ngày sinh bị chặn (blocksExactReading) → bazi adapter không dựng khối `bazi`; giữ nguyên
    // snapshot blocked, KHÔNG cố luận Mạnh Phái trên dữ liệu thiếu.
    if (!baziSnapshot.bazi) {
      return snapshot;
    }

    return { ...snapshot, mangpai: analyzeMangpaiReading(baziSnapshot.bazi) };
  }
}

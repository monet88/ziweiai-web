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
    // snapshotId Bát Tự có dạng `ba-zi-<hash>`; đổi prefix sang `mangpai-`. Nếu format đổi mà
    // prefix không còn khớp, replace im lặng sẽ giữ nguyên id `ba-zi-…` cho hệ mangpai — lệch
    // ngữ nghĩa. Throw sớm để lộ ngay thay vì trôi xuống tầng lưu trữ.
    if (!baziSnapshot.snapshotId.startsWith('ba-zi-')) {
      throw new Error(`MangpaiAdapter mong đợi snapshotId Bát Tự dạng "ba-zi-…", nhận được: "${baziSnapshot.snapshotId}"`);
    }
    const snapshot: ChartSnapshot = {
      ...baziSnapshot,
      chartSystem: 'mangpai',
      snapshotId: baziSnapshot.snapshotId.replace(/^ba-zi-/, 'mangpai-'),
      // Giữ provenance lunar-javascript của Bát Tự (Mạnh Phái thật sự dựng trên engine này), chỉ
      // đổi `system`. Có chủ đích — KHÔNG dùng sourcePriority 'manual-canonical-fixture' mà helper
      // sinh cho system='mangpai', vì nguồn tính can-chi vẫn là lunar-javascript.
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

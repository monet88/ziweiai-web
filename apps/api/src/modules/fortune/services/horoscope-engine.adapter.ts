import { Injectable } from '@nestjs/common';
import { computeZiweiHoroscope } from '@ziweiai/astro-engine';
import type { AnnualReportFrame, ChartSnapshot, HoroscopeFrame, HoroscopeItem, HoroscopeScope } from '@ziweiai/contracts';

/**
 * Adapter mỏng quanh `computeZiweiHoroscope` (decision 0011) để service `fortune` không phụ
 * thuộc trực tiếp vào engine — dễ mock trong unit test, và gom logic ghép 12 lưu nguyệt.
 */
@Injectable()
export class HoroscopeEngineAdapter {
  computeFrame(snapshot: ChartSnapshot, asOf: string, scopes: HoroscopeScope[]): HoroscopeFrame {
    return computeZiweiHoroscope({ snapshot, asOf, scopes });
  }

  /**
   * Ghép khung báo cáo năm: 1 lần tính lưu niên (mốc giữa năm) + 12 lần tính lưu nguyệt
   * (mốc ngày 15 mỗi tháng cho ổn định, tránh lệch tháng âm ở biên).
   *
   * Deterministic theo `(snapshot, year)` nên cache-hit có thể tái dựng lại cùng khung.
   */
  computeAnnualFrame(snapshot: ChartSnapshot, year: number): AnnualReportFrame {
    const yearlyFrame = this.computeFrame(snapshot, `${year}-06-15`, ['yearly']);
    const monthly: HoroscopeItem[] = [];

    for (let month = 1; month <= 12; month += 1) {
      const mm = String(month).padStart(2, '0');
      const frame = this.computeFrame(snapshot, `${year}-${mm}-15`, ['monthly']);
      if (!frame.monthly) {
        throw new Error(`Engine không trả lưu nguyệt cho ${year}-${mm}.`);
      }
      monthly.push(frame.monthly);
    }

    return { yearly: yearlyFrame.yearly, monthly };
  }
}

import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  destinyTimelineResponseSchema,
  type AuthenticatedUser,
  type DestinyAuspiciousLevel,
  type DestinyMonthScore,
  type DestinyTimelineResponse,
} from '@ziweiai/contracts';
import { containsCjkText, formatZiweiTokenVi } from '@ziweiai/core';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { throwQuotaRateLimited } from '../../quotas/quota-http';
import { ChartsRepository } from '../../../database/repositories/charts.repository';
import { QuotasService } from '../../quotas/quotas.service';
import { HoroscopeEngineAdapter } from './horoscope-engine.adapter';

const LUNAR_MONTH_NAMES = [
  'Tháng Giêng',
  'Tháng Hai',
  'Tháng Ba',
  'Tháng Tư',
  'Tháng Năm',
  'Tháng Sáu',
  'Tháng Bảy',
  'Tháng Tám',
  'Tháng Chín',
  'Tháng Mười',
  'Tháng Mười Một',
  'Tháng Chạp',
];

const HAN_SAFE_FALLBACK = 'Thuật ngữ cổ';

function viTerm(key: string): string {
  if (!key || typeof key !== 'string') return HAN_SAFE_FALLBACK;
  const vi = formatZiweiTokenVi(key);
  return containsCjkText(vi) ? HAN_SAFE_FALLBACK : vi;
}

@Injectable()
export class DestinyTimelineService {
  private readonly logger = new Logger(DestinyTimelineService.name);

  constructor(
    private readonly chartsRepository: ChartsRepository,
    private readonly quotasService: QuotasService,
    private readonly engine: HoroscopeEngineAdapter,
  ) {}

  async getDestinyTimeline(
    user: AuthenticatedUser,
    ipAddress: string,
    chartId: string,
    year: number,
  ): Promise<DestinyTimelineResponse> {
    const snapshot = await this.loadZiweiSnapshot(user, ipAddress, chartId);

    // Tính toán khung vận hạn 12 tháng từ HoroscopeEngineAdapter
    const annualFrame = this.engine.computeAnnualFrame(snapshot, year);
    const yearly = annualFrame.yearly;
    const yearGanZhi = `${viTerm(yearly.heavenlyStemKey)} ${viTerm(yearly.earthlyBranchKey)} ${year}`;

    const months: DestinyMonthScore[] = [];

    for (let i = 0; i < 12; i++) {
      const monthNum = i + 1;
      const item = annualFrame.monthly[i]!;
      const palaceName = item.palaceNameKeys[0] ? viTerm(item.palaceNameKeys[0]) : 'Cung Hạn';
      const ganZhi = `${viTerm(item.heavenlyStemKey)} ${viTerm(item.earthlyBranchKey)}`;
      const mutagens = item.mutagenStarKeys.map(viTerm);

      // Tra cứu các sao tại cung nguyệt hạn
      const targetPalace = snapshot.palaces.find((p) => p.index === item.index);
      const majorStarNames = targetPalace?.majorStars.map((s) => s.displayName) || [];
      const minorStarNames = targetPalace?.minorStars?.map((s) => s.displayName) || [];
      const allStars = [...majorStarNames, ...minorStarNames];

      // Tính điểm cát hung (0 - 100)
      let score = 60; // Base score bình hòa

      // Tứ Hóa ảnh hưởng chính
      const mutagensLower = mutagens.map((m) => m.toLowerCase());
      if (mutagensLower.some((m) => m.includes('lộc'))) score += 18;
      if (mutagensLower.some((m) => m.includes('quyền'))) score += 14;
      if (mutagensLower.some((m) => m.includes('khoa'))) score += 12;
      if (mutagensLower.some((m) => m.includes('kỵ'))) score -= 22;

      // Cát tinh hội tụ
      const auspiciousStars = ['Tử Vi', 'Thiên Phủ', 'Vũ Khúc', 'Thái Âm', 'Thái Dương', 'Tả Phụ', 'Hữu Bật', 'Văn Xương', 'Văn Khúc', 'Thiên Khôi', 'Thiên Việt', 'Hóa Lộc', 'Lộc Tồn'];
      const evilStars = ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp', 'Hóa Kỵ', 'Tuyệt', 'Tử'];

      let positivePoints = 0;
      for (const s of auspiciousStars) {
        if (allStars.some((star) => typeof star === 'string' && star.includes(s))) {
          positivePoints += 3;
        }
      }
      score += Math.min(positivePoints, 15);

      let negativePoints = 0;
      for (const s of evilStars) {
        if (allStars.some((star) => typeof star === 'string' && star.includes(s))) {
          negativePoints += 4;
        }
      }
      score -= Math.min(negativePoints, 18);

      // Cung vị quan trọng
      if (['Mệnh', 'Thân', 'Tài Bạch', 'Quan Lộc'].includes(palaceName)) {
        score += 4;
      }

      // Giới hạn điểm chuẩn trong khoảng 15..98
      score = Math.max(15, Math.min(98, Math.round(score)));

      let level: DestinyAuspiciousLevel = 'binh_hoa';
      if (score >= 84) level = 'dai_cat';
      else if (score >= 70) level = 'cat';
      else if (score >= 50) level = 'binh_hoa';
      else if (score >= 35) level = 'tieu_hung';
      else level = 'dai_hung';

      // Tạo highlights và lời khuyên phong thủy
      const highlights: string[] = [];
      if (mutagens.length > 0) {
        highlights.push(`Tứ Hóa kích hoạt: ${mutagens.join(', ')}`);
      }
      if (majorStarNames.length > 0) {
        highlights.push(`Chính tinh tọa thủ: ${majorStarNames.slice(0, 2).join(', ')}`);
      } else {
        highlights.push('Cung Vô Chính Diệu (mượn lực chiếu đối cung)');
      }

      let advice = '';
      if (level === 'dai_cat' || level === 'cat') {
        advice = `Thời cơ thuận lợi, đắc địa tại cung ${palaceName}. Thích hợp khởi sự kinh doanh, mở rộng đầu tư, xuất hành và đưa ra quyết định trọng đại.`;
      } else if (level === 'binh_hoa') {
        advice = `Vận khí ổn định, nhịp độ bình hòa. Nên củng cố nền tảng hiện tại, tích lũy nội lực và duy trì các mối quan hệ hòa hảo.`;
      } else {
        advice = `Tháng có xung động hoặc sát tinh tại cung ${palaceName}. Thận trọng tiền bạc, tránh tranh cãi thị phi, chú ý sức khỏe và giữ tâm thế dĩ hòa vi quý.`;
      }

      months.push({
        month: monthNum,
        solarMonth: `${String(monthNum).padStart(2, '0')}/${year}`,
        lunarMonthName: LUNAR_MONTH_NAMES[i] ?? `Tháng ${monthNum}`,
        ganZhi,
        palaceName,
        auspiciousScore: score,
        level,
        mutagens,
        highlights,
        advice,
      });
    }

    // Tìm tháng may mắn nhất và tháng cần cẩn trọng
    let luckiestMonth = 1;
    let maxScore = -1;
    let cautiousMonth = 1;
    let minScore = 999;
    let sumScore = 0;

    for (const m of months) {
      sumScore += m.auspiciousScore;
      if (m.auspiciousScore > maxScore) {
        maxScore = m.auspiciousScore;
        luckiestMonth = m.month;
      }
      if (m.auspiciousScore < minScore) {
        minScore = m.auspiciousScore;
        cautiousMonth = m.month;
      }
    }

    const averageScore = Math.round(sumScore / 12);
    const luckyMonthObj = months.find((m) => m.month === luckiestMonth);
    const cautiousMonthObj = months.find((m) => m.month === cautiousMonth);

    const annualOverview = `Năm ${yearGanZhi}: Khí vận tổng thể đạt mức ${averageScore}/100 điểm. ` +
      `Tháng đắc lợi nhất là ${luckyMonthObj?.lunarMonthName} (${luckyMonthObj?.solarMonth}) với điểm cát khí đạt ${maxScore}/100 tại cung ${luckyMonthObj?.palaceName}. ` +
      `Tháng cần cẩn trọng phòng bị là ${cautiousMonthObj?.lunarMonthName} (${cautiousMonthObj?.solarMonth}) tại cung ${cautiousMonthObj?.palaceName}. ` +
      `Nắm chắc tiết tấu cát hung 12 tháng giúp Đại Ka chủ động đón cát lánh hung, vạn sự hanh thông.`;

    const payload = {
      chartId,
      year,
      yearGanZhi,
      annualOverview,
      averageScore,
      luckiestMonth,
      cautiousMonth,
      months,
    };

    this.logger.log(`[destiny.timeline] chartId=${chartId} year=${year} avgScore=${averageScore}`);
    return destinyTimelineResponseSchema.parse(payload);
  }

  private async loadZiweiSnapshot(user: AuthenticatedUser, ipAddress: string, chartId: string) {
    try {
      await this.quotasService.assertCanExecute('chart', user.userId, ipAddress, user.email === null);
    } catch (error) {
      throwQuotaRateLimited(error, 'Đã vượt hạn mức tra cứu.');
    }

    const chartRecord = await this.chartsRepository.findChartSnapshotById(user.userId, chartId);
    if (!chartRecord) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy lá số đã lưu.');
    }
    if (chartRecord.snapshot.chartSystem !== 'zi-wei-dou-shu') {
      throw new ApiErrorHttpException(HttpStatus.BAD_REQUEST, 'INVALID_INPUT', 'Dòng thời gian vận hạn chỉ áp dụng cho lá số Tử Vi.');
    }
    return chartRecord.snapshot;
  }
}

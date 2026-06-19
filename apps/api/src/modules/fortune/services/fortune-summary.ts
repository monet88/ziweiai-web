import type { HoroscopeFrame, HoroscopeItem } from '@ziweiai/contracts';
import { containsCjkText, formatZiweiTokenVi } from '@ziweiai/core';

// Bất biến ngôn ngữ (invariants §2): mọi term render ra UI phải tiếng Việt. Engine đã ánh xạ
// Hán → ChartKey (ASCII), `formatZiweiTokenVi` dịch key → nhãn Việt. Nếu một key lạ làm hàm
// rơi về giá trị còn chứa Hán → thay bằng nhãn an toàn thay vì rò chữ Hán ra summary.
const HAN_SAFE_FALLBACK = 'Thuật ngữ cũ';

function viTerm(key: string): string {
  const vi = formatZiweiTokenVi(key);
  return containsCjkText(vi) ? HAN_SAFE_FALLBACK : vi;
}

function ganZhi(item: HoroscopeItem): string {
  return `${viTerm(item.heavenlyStemKey)} ${viTerm(item.earthlyBranchKey)}`;
}

function primaryPalace(item: HoroscopeItem): string {
  const first = item.palaceNameKeys[0];
  return first ? viTerm(first) : 'chưa xác định';
}

function mutagens(item: HoroscopeItem): string {
  const list = item.mutagenStarKeys.map(viTerm);
  return list.length > 0 ? list.join(', ') : 'không có sao Tứ Hóa nổi bật';
}

/**
 * Render đoạn văn vận ngày bằng tiếng Việt từ frame engine (KHÔNG gọi LLM — US-016).
 *
 * Deterministic theo `(chartId, asOf)`; chỉ đọc nhánh `daily` của frame. Mọi ký tự đầu ra
 * đã qua `viTerm` nên không rò chữ Hán (bất biến §2). Nếu frame thiếu `daily` (scope sai) →
 * trả thông điệp trống hợp lệ thay vì ném.
 */
export function renderDailyCanonicalText(frame: HoroscopeFrame): string {
  const daily = frame.daily;
  if (!daily) {
    return 'Chưa có dữ liệu vận ngày cho mốc thời gian này.';
  }

  return [
    `Vận ngày can chi ${ganZhi(daily)}.`,
    `Cung lưu nhật an tại cung ${primaryPalace(daily)}.`,
    `Tứ hóa lưu nhật: ${mutagens(daily)}.`,
    'Đây là gợi ý tham khảo theo nhịp ngày, bạn nên kết hợp với hoàn cảnh thực tế của mình.',
  ].join(' ');
}

/**
 * Render đoạn văn vận tháng bằng tiếng Việt từ frame engine (KHÔNG gọi LLM — US-016).
 *
 * Tương tự `renderDailyCanonicalText` nhưng đọc nhánh `monthly`.
 */
export function renderMonthlyCanonicalText(frame: HoroscopeFrame): string {
  const monthly = frame.monthly;
  if (!monthly) {
    return 'Chưa có dữ liệu vận tháng cho mốc thời gian này.';
  }

  return [
    `Vận tháng can chi ${ganZhi(monthly)}.`,
    `Cung lưu nguyệt an tại cung ${primaryPalace(monthly)}.`,
    `Tứ hóa lưu nguyệt: ${mutagens(monthly)}.`,
    'Hãy xem đây là xu hướng chung của tháng để chủ động sắp xếp những việc quan trọng.',
  ].join(' ');
}

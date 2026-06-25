import {
  translateBaziKey,
  translateQimenDunKey,
  translateQimenGateKey,
  translateQimenSpiritKey,
  translateQimenStarKey,
  translateQimenYuanKey,
  type ChartSnapshot,
  type QimenPalace,
} from '@ziweiai/contracts';
import { buildDivinationInquiryLines, type DivinationInquiry } from './divination-inquiry';

// Tên cung Lạc Thư 1-9 dùng để hiển thị (Khảm/Khôn/Chấn/Tốn/Trung/Càn/Đoài/Cấn/Ly).
const palaceLabelsVi: Record<number, string> = {
  1: 'Khảm 1',
  2: 'Khôn 2',
  3: 'Chấn 3',
  4: 'Tốn 4',
  5: 'Trung 5',
  6: 'Càn 6',
  7: 'Đoài 7',
  8: 'Cấn 8',
  9: 'Ly 9',
};

function formatPalace(palace: QimenPalace): string {
  const segments: string[] = [palaceLabelsVi[palace.palaceIndex] ?? `Cung ${palace.palaceIndex}`];

  if (palace.diPanStemKey) {
    segments.push(`Địa: ${translateBaziKey(palace.diPanStemKey)}`);
  }
  if (palace.tianPanStemKey) {
    segments.push(`Thiên: ${translateBaziKey(palace.tianPanStemKey)}`);
  }
  if (palace.starKey) {
    const star = translateQimenStarKey(palace.starKey);
    const companion = palace.companionStarKey ? ` + ${translateQimenStarKey(palace.companionStarKey)}` : '';
    segments.push(`Tinh: ${star}${companion}`);
  }
  if (palace.gateKey) {
    segments.push(`Môn: ${translateQimenGateKey(palace.gateKey)}`);
  }
  if (palace.spiritKey) {
    segments.push(`Thần: ${translateQimenSpiritKey(palace.spiritKey)}`);
  }

  return segments.join(' | ');
}

export function buildQimenExplanationPrompt(
  snapshot: ChartSnapshot,
  explanationKind: string,
  inquiry?: DivinationInquiry,
): string {
  const inquiryLines = buildDivinationInquiryLines(
    inquiry,
    'Chọn dụng thần (cửa/sao/thần/can) ứng với việc được hỏi rồi xét bố cục cửu cung, Trực phù - Trực sử và cát hung của cửa để chỉ ra hướng, thời điểm nên hành động và điều cần tránh đúng theo câu hỏi.',
  );
  if (!snapshot.qimen) {
    return [
      'Bạn là chuyên gia luận giải Kỳ Môn Độn Giáp, văn phong rõ ràng, chiến lược, hoàn toàn bằng tiếng Việt.',
      'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
      ...inquiryLines,
      `Mục đích luận giải: ${explanationKind}`,
      'Dữ liệu Kỳ Môn chi tiết chưa sẵn sàng, hãy chỉ viết tổng quan ngắn từ phần tóm tắt hiện có.',
      ...Object.entries(snapshot.summary).map(([label, value]) => `${label}: ${String(value)}`),
    ].join('\n');
  }

  const q = snapshot.qimen;
  const palaceLines = q.palaces.map(formatPalace).join('\n');

  return [
    'Bạn là chuyên gia luận giải Kỳ Môn Độn Giáp, văn phong rõ ràng, chiến lược, hoàn toàn bằng tiếng Việt.',
    'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
    'Tập trung vào cục Âm/Dương Độn, số cục, Trực phù, Trực sử, cửa cát/hung và bố cục thần/sao trong cửu cung để gợi ý hướng đi và thời điểm hành động.',
    'Trả về Markdown khoảng 420-680 từ, giải thích kỹ và dễ hiểu cho người mới, gồm: tổng quan thế cục, cung quan trọng, cửa nên dùng, thời điểm và hướng nên đi, điều cần tránh.',
    ...inquiryLines,
    `Mục đích luận giải: ${explanationKind}`,
    `Cục: ${translateQimenDunKey(q.dunKey)} ${q.juShu} (${translateQimenYuanKey(q.yuanKey)})`,
    `Trực phù: ${translateQimenStarKey(q.dutyChiefStarKey)}`,
    `Trực sử: ${translateQimenGateKey(q.dutyGateKey)}`,
    'Cửu cung chi tiết:',
    palaceLines,
  ].join('\n');
}

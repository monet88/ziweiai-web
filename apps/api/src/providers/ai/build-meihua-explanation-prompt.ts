import {
  formatMeihuaHexagramLabel,
  translateMeihuaElementKey,
  translateMeihuaRelationKey,
  translateMeihuaTrigramKey,
  type ChartSnapshot,
} from '@ziweiai/contracts';
import { buildDivinationInquiryLines, type DivinationInquiry } from './divination-inquiry';

function formatHexagramLines(lines: NonNullable<ChartSnapshot['meihua']>['mainHexagram']['lines']): string {
  return [...lines]
    .sort((a, b) => b.position - a.position)
    .map((line) => `${line.position}: ${line.value === 'yang' ? 'dương' : 'âm'}${line.isMoving ? ' (động)' : ''}`)
    .join(', ');
}

export function buildMeihuaExplanationPrompt(
  snapshot: ChartSnapshot,
  explanationKind: string,
  inquiry?: DivinationInquiry,
): string {
  const inquiryLines = buildDivinationInquiryLines(
    inquiry,
    'Soi câu hỏi qua quan hệ thể-dụng và hào động: thể là người hỏi, dụng là việc được hỏi; quẻ biến cho biết diễn tiến sắp tới của chính việc đó.',
  );
  if (!snapshot.meihua) {
    return [
      'Bạn là chuyên gia luận giải Mai Hoa Dịch Số, trả lời hoàn toàn bằng tiếng Việt.',
      'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
      ...inquiryLines,
      `Mục đích luận giải: ${explanationKind}`,
      'Dữ liệu Mai Hoa chi tiết chưa sẵn sàng, hãy chỉ nêu tổng quan ngắn từ phần tóm tắt hiện có.',
      ...Object.entries(snapshot.summary).map(([label, value]) => `${label}: ${String(value)}`),
    ].join('\n');
  }

  return [
    'Bạn là chuyên gia luận giải Mai Hoa Dịch Số, trả lời hoàn toàn bằng tiếng Việt.',
    'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
    'Tập trung vào quẻ chính, quẻ hỗ, quẻ biến, hào động và quan hệ thể dụng để suy diễn tình thế.',
    'Trả về Markdown khoảng 350-600 từ, giải thích kỹ và dễ hiểu cho người mới, gồm: nhận định hiện trạng, diễn biến, điểm cần lưu ý và gợi ý hành động.',
    ...inquiryLines,
    `Mục đích luận giải: ${explanationKind}`,
    `Phương pháp: ${snapshot.meihua.method}`,
    `Quẻ chính: ${formatMeihuaHexagramLabel(snapshot.meihua.mainHexagram)}`,
    `Quẻ hỗ: ${formatMeihuaHexagramLabel(snapshot.meihua.nuclearHexagram)}`,
    `Quẻ biến: ${formatMeihuaHexagramLabel(snapshot.meihua.changedHexagram)}`,
    `Hào động: ${snapshot.meihua.movingLine}`,
    `Thể quái: ${translateMeihuaTrigramKey(snapshot.meihua.bodyTrigramKey)} (${translateMeihuaElementKey(snapshot.meihua.bodyElementKey)})`,
    `Dụng quái: ${translateMeihuaTrigramKey(snapshot.meihua.useTrigramKey)} (${translateMeihuaElementKey(snapshot.meihua.useElementKey)})`,
    `Quan hệ thể dụng: ${translateMeihuaRelationKey(snapshot.meihua.relationKey)}`,
    `Cấu trúc quẻ chính: ${formatHexagramLines(snapshot.meihua.mainHexagram.lines)}`,
  ].join('\n');
}

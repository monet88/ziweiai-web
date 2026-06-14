import {
  formatMeihuaHexagramLabel,
  translateBaziKey,
  translateLiuyaoLineStateKey,
  translateLiuyaoLineValueKey,
  translateLiuyaoMethodKey,
  translateLiuyaoRoleKey,
  translateLiuyaoSixKinKey,
  translateLiuyaoSixSpiritKey,
  type ChartSnapshot,
} from '@ziweiai/contracts';

function formatLiuyaoLine(
  line: NonNullable<ChartSnapshot['liuyao']>['baseHexagram']['lines'][number],
): string {
  const value = translateLiuyaoLineValueKey(line.value);
  const state = translateLiuyaoLineStateKey(line.stateKey);
  const role = translateLiuyaoRoleKey(line.roleKey);
  const sixKin = translateLiuyaoSixKinKey(line.sixKinKey);
  const sixSpirit = translateLiuyaoSixSpiritKey(line.sixSpiritKey);
  const branch = translateBaziKey(line.earthlyBranchKey);
  const element = translateBaziKey(line.fiveElementKey);
  const hidden = line.hiddenSpirit ? ` | Phục thần: ${line.hiddenSpirit}` : '';
  const moving = line.isMoving ? ' (động)' : '';
  return `Hào ${line.position}: ${value} ${state}${moving} — ${role}, ${sixKin}, ${sixSpirit}, ${branch} (${element})${hidden}, ${line.naYin}`;
}

export function buildLiuyaoExplanationPrompt(snapshot: ChartSnapshot, explanationKind: string): string {
  if (!snapshot.liuyao) {
    return [
      'Bạn là chuyên gia luận giải Lục Hào, văn phong thực tế, chi tiết từng hào và hoàn toàn bằng tiếng Việt.',
      'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
      `Mục đích luận giải: ${explanationKind}`,
      'Dữ liệu Lục Hào chi tiết chưa sẵn sàng, hãy chỉ viết tổng quan ngắn từ phần tóm tắt hiện có.',
      ...Object.entries(snapshot.summary).map(([label, value]) => `${label}: ${String(value)}`),
    ].join('\n');
  }

  const l = snapshot.liuyao;
  const moving = l.movingLinePositions.join(', ');

  const baseLines = l.baseHexagram.lines.map(formatLiuyaoLine).join('\n');
  const changedLines = l.changedHexagram.lines.map(formatLiuyaoLine).join('\n');
  const nuclearLines = l.nuclearHexagram ? l.nuclearHexagram.lines.map(formatLiuyaoLine).join('\n') : '';

  return [
    'Bạn là chuyên gia luận giải Lục Hào (Lục Hào Dịch), văn phong thực tế, chi tiết từng hào, hoàn toàn bằng tiếng Việt.',
    'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
    'Tập trung vào quẻ gốc, quẻ biến, hào động, thế/ứng, lục thân, lục thần, nạp âm và phục thần để suy diễn tình thế và hướng xử lý.',
    'Trả về Markdown khoảng 400-650 từ, giải thích kỹ và dễ hiểu cho người mới, gồm: tổng quan thế cục, phân tích quẻ gốc & biến, các hào then chốt, gợi ý hành động cụ thể.',
    `Mục đích luận giải: ${explanationKind}`,
    `Phương pháp: ${translateLiuyaoMethodKey(l.method)}`,
    `Hào động: ${moving}`,
    `Quẻ gốc: ${formatMeihuaHexagramLabel(l.baseHexagram)} | ${l.baseHexagram.symbol}`,
    `Quẻ biến: ${formatMeihuaHexagramLabel(l.changedHexagram)} | ${l.changedHexagram.symbol}`,
    l.nuclearHexagram ? `Quẻ hỗ: ${formatMeihuaHexagramLabel(l.nuclearHexagram)} | ${l.nuclearHexagram.symbol}` : '',
    'Chi tiết quẻ gốc:',
    baseLines,
    'Chi tiết quẻ biến:',
    changedLines,
    l.nuclearHexagram ? 'Chi tiết quẻ hỗ:' : '',
    nuclearLines,
  ]
    .filter(Boolean)
    .join('\n');
}

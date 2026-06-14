import {
  translateBaziKey,
  translateDaliurenBoardTypeKey,
  translateDaliurenMonthGeneralKey,
  translateDaliurenSpiritKey,
  translateDaliurenTransmissionSlot,
  translateLiuyaoSixKinKey,
  type ChartSnapshot,
  type DaliurenChart,
} from '@ziweiai/contracts';

function formatCellLine(cell: DaliurenChart['cells'][number]): string {
  const stem = cell.stemKey ? translateBaziKey(cell.stemKey) : 'không độn can';
  return `${translateBaziKey(cell.positionBranchKey)} (địa bàn) ↦ Thiên ${translateBaziKey(cell.heavenBranchKey)} | ${translateDaliurenSpiritKey(cell.spiritKey)} | ${stem}`;
}

function formatLessonLine(lesson: DaliurenChart['fourLessons'][number]): string {
  // Khóa 1 lấy nhật can; khóa 2-4 lấy địa chi (đã đảm bảo trong contract).
  const lower = lesson.lowerStemKey
    ? `Can ${translateBaziKey(lesson.lowerStemKey)}`
    : lesson.lowerBranchKey
      ? `Chi ${translateBaziKey(lesson.lowerBranchKey)}`
      : 'không xác định';
  const dunGan = lesson.dunGanKey ? `, độn can ${translateBaziKey(lesson.dunGanKey)}` : '';
  return `Khóa ${lesson.position}: trên ${translateBaziKey(lesson.upperBranchKey)} / dưới ${lower}${dunGan} | ${translateDaliurenSpiritKey(lesson.spiritKey)}`;
}

function formatTransmissionLine(transmission: DaliurenChart['threeTransmissions'][number]): string {
  const dunGan = transmission.dunGanKey ? `, độn can ${translateBaziKey(transmission.dunGanKey)}` : '';
  return `${translateDaliurenTransmissionSlot(transmission.slot)}: ${translateBaziKey(transmission.branchKey)}${dunGan} | ${translateDaliurenSpiritKey(transmission.spiritKey)} | ${translateLiuyaoSixKinKey(transmission.sixKinKey)}`;
}

export function buildDaliurenExplanationPrompt(snapshot: ChartSnapshot, explanationKind: string): string {
  if (!snapshot.daliuren) {
    return [
      'Bạn là chuyên gia luận giải Đại Lục Nhâm, văn phong trang trọng và hoàn toàn bằng tiếng Việt.',
      'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
      `Mục đích luận giải: ${explanationKind}`,
      'Dữ liệu Đại Lục Nhâm chi tiết chưa sẵn sàng, hãy chỉ viết tổng quan ngắn dựa vào summary hiện có.',
      ...Object.entries(snapshot.summary).map(([label, value]) => `${label}: ${String(value)}`),
    ].join('\n');
  }

  const d = snapshot.daliuren;

  return [
    'Bạn là chuyên gia luận giải Đại Lục Nhâm, văn phong trang trọng, suy đoán theo tứ khóa - tam truyền - thiên địa bàn, hoàn toàn bằng tiếng Việt.',
    'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
    'Tập trung vào: kiểu thiên địa bàn (như Phục Ngâm, Phản Ngâm, Tam Hợp...), nguyệt tướng - thời chi, ý nghĩa của bốn khóa (đặc biệt khóa 1), diễn biến tam truyền (sơ → trung → mạt) và tương tác lục thân với nhật can.',
    'Trả về Markdown khoảng 420-680 từ, giải thích kỹ và dễ hiểu cho người mới, gồm: tổng quan thế cục, phân tích bốn khóa, diễn biến tam truyền, gợi ý ứng xử.',
    `Mục đích luận giải: ${explanationKind}`,
    `Kiểu thiên địa bàn: ${translateDaliurenBoardTypeKey(d.boardTypeKey)}`,
    `Nguyệt tướng: ${translateBaziKey(d.monthGeneralBranchKey)} ${translateDaliurenMonthGeneralKey(d.monthGeneralKey)}`,
    'Thiên địa bàn (12 cung):',
    ...d.cells.map(formatCellLine),
    'Tứ khóa:',
    ...d.fourLessons.map(formatLessonLine),
    'Tam truyền:',
    ...d.threeTransmissions.map(formatTransmissionLine),
  ].join('\n');
}

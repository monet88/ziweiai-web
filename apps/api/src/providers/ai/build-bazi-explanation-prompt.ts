import {
  formatBaziStemBranchLabel,
  translateBaziKey,
  type BaziPillarDetail,
  type ChartSnapshot,
} from '@ziweiai/contracts';

function formatPillarHeader(pillar: BaziPillarDetail): string {
  return `${translateBaziKey(pillar.slot)} trụ: ${formatBaziStemBranchLabel(pillar)}`;
}

function formatPillarDetail(pillar: BaziPillarDetail): string {
  const hiddenStems = pillar.hiddenStems
    .map((item) => `${translateBaziKey(item.heavenlyStemKey)} (${item.tenGodKey ? translateBaziKey(item.tenGodKey) : 'chưa định danh'})`)
    .join(', ');
  const branchTenGods = pillar.earthlyBranchTenGodKeys.map((item) => translateBaziKey(item)).join(', ');

  return [
    formatPillarHeader(pillar),
    `Can: ${translateBaziKey(pillar.heavenlyStemElementKey)} - ${translateBaziKey(pillar.heavenlyStemTenGodKey)}`,
    `Chi: ${translateBaziKey(pillar.earthlyBranchElementKey)} - ${branchTenGods || 'chưa định danh'}`,
    `Tàng can: ${hiddenStems || 'không có'}`,
    `Nạp âm: ${pillar.naYin}`,
  ].join('\n');
}

export function buildBaziExplanationPrompt(snapshot: ChartSnapshot, explanationKind: string): string {
  if (!snapshot.bazi) {
    return [
      'Bạn là chuyên gia luận giải Bát Tự, văn phong rõ ràng, thực tế và hoàn toàn bằng tiếng Việt.',
      'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
      `Mục đích luận giải: ${explanationKind}`,
      'Dữ liệu Bát Tự sâu chưa sẵn sàng, hãy chỉ viết một phần tổng quan ngắn dựa trên summary hiện có.',
      ...Object.entries(snapshot.summary).map(([label, value]) => `${label}: ${String(value)}`),
    ].join('\n');
  }

  return [
    'Bạn là chuyên gia luận giải Bát Tự, văn phong rõ ràng, thực tế và hoàn toàn bằng tiếng Việt.',
    'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
    'Trình tự suy luận BẮT BUỘC: (1) xác định ngày chủ và mức vượng/nhược của nó; (2) xét tương quan thập thần giữa bốn trụ; (3) đọc tàng can để thấy lực ẩn; (4) đối chiếu nạp âm và quan hệ sinh - khắc ngũ hành; (5) tổng hợp thành luận giải.',
    'Cấu trúc bài viết theo các đề mục Markdown sau, đúng thứ tự: "## Tổng quan", "## Điểm mạnh", "## Điểm cần lưu ý", "## Gợi ý hành động".',
    'Trả về Markdown khoảng 350-600 từ, giải thích kỹ và dễ hiểu cho người mới; mỗi nhận định phải gắn với dữ kiện Bát Tự cụ thể bên dưới, không nói chung chung.',
    `Mục đích luận giải: ${explanationKind}`,
    `Ngày chủ: ${translateBaziKey(snapshot.bazi.dayMasterHeavenlyStemKey)}`,
    `Thai nguyên: ${formatBaziStemBranchLabel(snapshot.bazi.taiYuan)} - ${snapshot.bazi.taiYuan.naYin}`,
    `Thai tức: ${formatBaziStemBranchLabel(snapshot.bazi.taiXi)} - ${snapshot.bazi.taiXi.naYin}`,
    `Mệnh cung: ${formatBaziStemBranchLabel(snapshot.bazi.mingGong)} - ${snapshot.bazi.mingGong.naYin}`,
    `Thân cung: ${formatBaziStemBranchLabel(snapshot.bazi.shenGong)} - ${snapshot.bazi.shenGong.naYin}`,
    'Khung phân tích nâng cao (suy luận trong nội bộ rồi rút ra kết luận, KHÔNG liệt kê thuật ngữ khô khan): cân nhắc dụng thần (ngũ hành cần bổ trợ cho ngày chủ), cách cục (thế cục chủ đạo của lá số), điều hậu (điều hòa hàn - táo - nhiệt theo mùa sinh), và thần sát nổi bật (chỉ nêu khi thực sự ảnh hưởng). Diễn giải bằng ngôn ngữ đời thường, gắn với dữ kiện bên dưới.',
    'Tứ trụ chi tiết:',
    ...snapshot.bazi.pillars.map(formatPillarDetail),
  ].join('\n');
}

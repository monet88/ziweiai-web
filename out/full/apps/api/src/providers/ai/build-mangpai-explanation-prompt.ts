import {
  formatBaziStemBranchLabel,
  translateBaziKey,
  type BaziPillarDetail,
  type ChartSnapshot,
} from '@ziweiai/contracts';

// Prompt luận giải Mạnh Phái (US-017d). Mạnh Phái dựng trên Bát Tự nên prompt mang cấu trúc tứ
// trụ giống Bát Tự, NHƯNG ưu tiên khối `snapshot.mangpai` (nhật chủ + cường/nhược + dụng thần đã
// luận deterministic tiếng Việt). Nếu không kèm khối này, luận giải AI sẽ bỏ qua chính giá trị
// cốt lõi của hệ Mạnh Phái (P2 review PR #27). Bất biến: 0 chữ Hán trong nội dung.

function formatPillarDetail(pillar: BaziPillarDetail): string {
  const hiddenStems = pillar.hiddenStems
    .map((item) => `${translateBaziKey(item.heavenlyStemKey)} (${item.tenGodKey ? translateBaziKey(item.tenGodKey) : 'chưa định danh'})`)
    .join(', ');
  const branchTenGods = pillar.earthlyBranchTenGodKeys.map((item) => translateBaziKey(item)).join(', ');

  return [
    `${translateBaziKey(pillar.slot)} trụ: ${formatBaziStemBranchLabel(pillar)}`,
    `Can: ${translateBaziKey(pillar.heavenlyStemElementKey)} - ${translateBaziKey(pillar.heavenlyStemTenGodKey)}`,
    `Chi: ${translateBaziKey(pillar.earthlyBranchElementKey)} - ${branchTenGods || 'chưa định danh'}`,
    `Tàng can: ${hiddenStems || 'không có'}`,
    `Nạp âm: ${pillar.naYin}`,
  ].join('\n');
}

export function buildMangpaiExplanationPrompt(snapshot: ChartSnapshot, explanationKind: string): string {
  // Dữ liệu chưa sẵn sàng (vd giờ sinh không xác định → snapshot blocked, không có bazi/mangpai):
  // chỉ viết tổng quan ngắn từ summary, không bịa luận Mạnh Phái.
  if (!snapshot.bazi || !snapshot.mangpai) {
    return [
      'Bạn là chuyên gia luận giải Mạnh Phái (phái lấy nhật chủ làm trọng), văn phong rõ ràng, thực tế và hoàn toàn bằng tiếng Việt.',
      'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
      `Mục đích luận giải: ${explanationKind}`,
      'Dữ liệu Mạnh Phái chi tiết chưa sẵn sàng, hãy chỉ viết một phần tổng quan ngắn dựa trên summary hiện có.',
      ...Object.entries(snapshot.summary).map(([label, value]) => `${label}: ${String(value)}`),
    ].join('\n');
  }

  const mangpai = snapshot.mangpai;

  return [
    'Bạn là chuyên gia luận giải Mạnh Phái (phái lấy nhật chủ làm trọng), văn phong rõ ràng, thực tế và hoàn toàn bằng tiếng Việt.',
    'BẮT BUỘC: không dùng ký tự chữ Hán/Trung/Nhật/Hàn trong nội dung trả lời.',
    'Luận theo phép Mạnh Phái: lấy nhật chủ làm trục, xét cường/nhược theo nguyệt lệnh rồi định hỷ dụng thần; tứ trụ là bối cảnh hỗ trợ.',
    'Trả về Markdown khoảng 350-600 từ, dễ hiểu cho người mới, gồm: tổng quan nhật chủ, cường nhược và dụng thần, điểm mạnh, điểm cần lưu ý, gợi ý hành động.',
    `Mục đích luận giải: ${explanationKind}`,
    'Luận giải Mạnh Phái cốt lõi:',
    `Tiêu đề: ${mangpai.title}`,
    `Tổng quan: ${mangpai.narrative}`,
    `Nhật chủ: ${translateBaziKey(mangpai.dayMasterElementKey)} | Hành lệnh tháng: ${translateBaziKey(mangpai.monthCommandElementKey)}`,
    ...mangpai.insights.map((insight) => `- ${insight.heading}: ${insight.detail}`),
    'Tứ trụ chi tiết (bối cảnh):',
    ...snapshot.bazi.pillars.map(formatPillarDetail),
  ].join('\n');
}

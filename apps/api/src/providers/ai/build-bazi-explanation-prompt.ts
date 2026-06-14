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
    'Giải thích dựa trên cấu trúc Bát Tự, ưu tiên ngày chủ, tương quan thập thần, tàng can và nạp âm.',
    'Trả về Markdown khoảng 350-600 từ, giải thích kỹ và dễ hiểu cho người mới, gồm: tổng quan, điểm mạnh, điểm cần lưu ý, gợi ý hành động.',
    `Mục đích luận giải: ${explanationKind}`,
    `Ngày chủ: ${translateBaziKey(snapshot.bazi.dayMasterHeavenlyStemKey)}`,
    `Thai nguyên: ${formatBaziStemBranchLabel(snapshot.bazi.taiYuan)} - ${snapshot.bazi.taiYuan.naYin}`,
    `Thai tức: ${formatBaziStemBranchLabel(snapshot.bazi.taiXi)} - ${snapshot.bazi.taiXi.naYin}`,
    `Mệnh cung: ${formatBaziStemBranchLabel(snapshot.bazi.mingGong)} - ${snapshot.bazi.mingGong.naYin}`,
    `Thân cung: ${formatBaziStemBranchLabel(snapshot.bazi.shenGong)} - ${snapshot.bazi.shenGong.naYin}`,
    'Tứ trụ chi tiết:',
    ...snapshot.bazi.pillars.map(formatPillarDetail),
  ].join('\n');
}

import type { AnnualReportFrame, ChartSnapshot, HoroscopeItem } from '@ziweiai/contracts';
import { containsCjkText, formatZiweiTokenVi } from '@ziweiai/core';

// Bất biến ngôn ngữ (invariants §2): nhãn lọt vào prompt LLM phải tiếng Việt. Nếu một key lạ
// làm `formatZiweiTokenVi` rơi về giá trị còn chứa Hán, thay bằng nhãn an toàn — tránh rò chữ
// Hán vào prompt rồi bị LLM tái tạo ra Markdown hiển thị cho người dùng. Đồng bộ `fortune-summary.ts`.
const HAN_SAFE_FALLBACK = 'Thuật ngữ cũ';

const MONTH_LABELS_VI = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

function term(key: string): string {
  // Guard phòng thủ tại biên dựng prompt: key rỗng/không phải chuỗi (dữ liệu cũ, engine đổi
  // shape) trả nhãn an toàn thay vì để `formatZiweiTokenVi` ném — bất biến §2 (không rò chữ Hán
  // vào prompt LLM, không vỡ luồng tạo báo cáo) ưu tiên hơn việc fail sớm ở đây. Đồng bộ `viTerm`.
  if (typeof key !== 'string' || key.length === 0) {
    return HAN_SAFE_FALLBACK;
  }
  const vi = formatZiweiTokenVi(key);
  return containsCjkText(vi) ? HAN_SAFE_FALLBACK : vi;
}

function describeItem(item: HoroscopeItem): string {
  const palaces = item.palaceNameKeys.map(term).join(', ') || 'chưa xác định';
  const mutagens = item.mutagenStarKeys.map(term).join(', ') || 'không có';
  return `can chi ${term(item.heavenlyStemKey)} ${term(item.earthlyBranchKey)}; cung trọng tâm: ${palaces}; Tứ Hóa: ${mutagens}`;
}

/**
 * Dựng user-prompt tiếng Việt cho báo cáo năm (US-016).
 *
 * Cung cấp cho LLM khung lưu niên + 12 lưu nguyệt (đã ánh xạ ChartKey → nhãn Việt nên không
 * rò chữ Hán vào prompt), yêu cầu tổng hợp Markdown ~600-1200 từ. System prompt
 * (`EXPLANATION_SYSTEM_PROMPT`) đã ép bất biến ngôn ngữ + giọng văn; prompt này lo cấu trúc.
 * Nhận `snapshot` để có hệ lá số (giữ khả năng mở rộng theo hệ); hiện chỉ dùng để chú thích.
 */
export function buildAnnualReportPrompt(snapshot: ChartSnapshot, frame: AnnualReportFrame, year: number): string {
  const monthlyLines = frame.monthly.map((item, index) => `- ${MONTH_LABELS_VI[index]}: ${describeItem(item)}`);

  return [
    `Hãy viết một báo cáo vận hạn năm ${year} cho một lá số ${term(snapshot.chartSystem)}, bằng tiếng Việt, định dạng Markdown.`,
    'Yêu cầu độ dài khoảng 600-1200 từ, văn phong gần gũi, giải thích thuật ngữ ngay khi dùng.',
    '',
    `Lưu niên năm ${year}: ${describeItem(frame.yearly)}`,
    '',
    'Mười hai lưu nguyệt trong năm:',
    ...monthlyLines,
    '',
    'Cấu trúc báo cáo mong muốn:',
    `- Mở đầu: xu hướng tổng quan của năm ${year}.`,
    '- Thân bài: nhóm các tháng theo chủ đề (sự nghiệp, tài chính, tình cảm, sức khỏe), nêu điểm nóng theo tháng.',
    '- Kết bài: dùng đúng tiêu đề "## Tóm lại" với 3-5 câu chốt ý + một gợi ý hành động tích cực.',
  ].join('\n');
}

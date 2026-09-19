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
    `Bạn là một chuyên gia Tử Vi Đẩu Số đại tài. Hãy lập một BÁO CÁO LUẬN GIẢI CHUYÊN SÂU (Premium Report) năm ${year} cho một lá số ${term(snapshot.chartSystem)}, bằng tiếng Việt, định dạng Markdown.`,
    'Báo cáo này dành cho khách hàng VIP. Ngôn từ cần trang trọng, chuyên sâu, nhưng diễn đạt phải dễ hiểu, thấu cảm và có tính định hướng ứng dụng cao. Giải thích rõ ràng các thuật ngữ (như Tứ Hóa, Can Chi) ngay khi dùng.',
    '',
    `Dữ liệu Lưu niên năm ${year}: ${describeItem(frame.yearly)}`,
    '',
    'Mười hai lưu nguyệt (các tháng) trong năm:',
    ...monthlyLines,
    '',
    'Cấu trúc Báo Cáo Chuyên Sâu (Premium Report) bắt buộc:',
    `# 🌟 Báo Cáo Vận Hạn Chuyên Sâu Năm ${year}`,
    '## 1. Bức Tranh Tổng Quan',
    '- Đánh giá chung về thời vận, hung cát trong năm. Phân tích sự tương tác của Can Chi lưu niên và Cung trọng tâm.',
    '- Ảnh hưởng của Tứ Hóa lưu niên (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ) lên các phương diện cuộc sống.',
    '## 2. Phân Tích Chuyên Sâu Các Phương Diện',
    '- **💼 Công Danh & Sự Nghiệp:** Cơ hội thăng tiến, thay đổi công việc, quan hệ đồng nghiệp.',
    '- **💰 Tài Chính & Đầu Tư:** Dòng tiền, lộc tồn, rủi ro hao tài.',
    '- **❤️ Gia Đạo & Tình Duyên:** Các mối quan hệ, nhân duyên, mâu thuẫn cần tránh.',
    '- **🧘 Sức Khỏe & Bình An:** Thể trạng, tai ách (nếu có) và cách phòng tránh.',
    '## 3. Diễn Biến Chi Tiết 12 Tháng (Lưu Nguyệt)',
    '- Điểm mặt các tháng có biến động lớn (Tốt/Xấu) dựa vào dữ liệu cung trọng tâm và Tứ Hóa của tháng đó.',
    '- Các tháng bình ổn có thể gộp chung hoặc nói ngắn gọn.',
    '## 4. Lời Khuyên Cải Vận (Tóm lại)',
    '- Dùng đúng tiêu đề "## Tóm lại".',
    '- Đưa ra 3-5 câu chốt ý quan trọng nhất của cả năm.',
    '- Kèm theo 2-3 hành động thực tế (ví dụ: cách ứng xử, tu tâm, bố trí phong thủy cơ bản) để hóa giải hung tinh, đón nhận cát tinh.',
  ].join('\n');
}

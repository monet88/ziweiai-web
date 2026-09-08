import { Injectable } from '@nestjs/common';
import { IChingHexagram } from '@ziweiai/contracts';

// Cấu trúc 64 quẻ Kinh Dịch theo thứ tự Văn Vương (King Wen sequence)
export const HEXAGRAM_NAMES_VI = [
  "Thuần Càn", "Thuần Khôn", "Thủy Lôi Truân", "Sơn Thủy Mông", "Thủy Thiên Nhu", "Thiên Thủy Tụng", "Địa Thủy Sư", "Thủy Địa Tỷ",
  "Phong Thiên Tiểu Súc", "Thiên Trạch Lý", "Địa Thiên Thái", "Thiên Địa Bĩ", "Thiên Hỏa Đồng Nhân", "Hỏa Thiên Đại Hữu", "Địa Sơn Khiêm", "Lôi Địa Dự",
  "Trạch Lôi Tùy", "Sơn Phong Cổ", "Địa Trạch Lâm", "Phong Địa Quan", "Hỏa Lôi Phệ Hạp", "Sơn Hỏa Bí", "Sơn Địa Bác", "Địa Lôi Phục",
  "Thiên Lôi Vô Vọng", "Sơn Thiên Đại Súc", "Sơn Lôi Di", "Trạch Phong Đại Quá", "Thuần Khảm", "Thuần Ly", "Trạch Sơn Hàm", "Lôi Phong Hằng",
  "Thiên Sơn Độn", "Lôi Thiên Đại Tráng", "Hỏa Địa Tấn", "Địa Hỏa Minh Di", "Phong Hỏa Gia Nhân", "Hỏa Trạch Khuê", "Thủy Sơn Kiển", "Lôi Thủy Giải",
  "Sơn Trạch Tổn", "Phong Lôi Ích", "Trạch Thiên Quải", "Thiên Phong Cấu", "Trạch Địa Tụy", "Địa Phong Thăng", "Trạch Thủy Khốn", "Thủy Phong Tỉnh",
  "Trạch Hỏa Cách", "Hỏa Phong Đỉnh", "Thuần Chấn", "Thuần Cấn", "Phong Sơn Tiệm", "Lôi Trạch Quy Muội", "Lôi Hỏa Phong", "Hỏa Sơn Lữ",
  "Thuần Tốn", "Thuần Đoài", "Phong Thủy Hoán", "Thủy Trạch Tiết", "Phong Trạch Trung Phu", "Lôi Sơn Tiểu Quá", "Thủy Hỏa Ký Tế", "Hỏa Thủy Vị Tế"
];

@Injectable()
export class IChingGroundingAdapter {
  async getGroundingContext(input: {
    question: string;
    baseHexagram: IChingHexagram;
    changedHexagram?: IChingHexagram;
    changingLines: number[];
  }): Promise<string> {
    let context = `Câu hỏi của người dùng: "${input.question}"\n\n`;
    
    context += `Quẻ Chủ (hiện trạng): Quẻ số ${input.baseHexagram.id} - ${input.baseHexagram.name}\n`;
    context += `Cấu trúc hào (từ Sơ hào đến Thượng hào): ${input.baseHexagram.lines.join(', ')} (6: Lão Âm, 7: Thiếu Dương, 8: Thiếu Âm, 9: Lão Dương)\n\n`;

    if (input.changingLines.length > 0 && input.changedHexagram) {
      context += `Các hào động: Hào ${input.changingLines.map(l => l + 1).join(', ')}\n`;
      context += `Quẻ Biến (tương lai/biến hóa): Quẻ số ${input.changedHexagram.id} - ${input.changedHexagram.name}\n`;
      context += `Hãy luận giải sự biến đổi từ Quẻ Chủ sang Quẻ Biến dựa trên các hào động.\n`;
    } else {
      context += `Quẻ này không có hào động. Hãy luận giải dựa trên ý nghĩa toàn vẹn của Quẻ Chủ.\n`;
    }

    context += `\nYêu cầu phân tích:\n`;
    context += `1. Giải thích ý nghĩa tổng quan của Quẻ Chủ.\n`;
    if (input.changingLines.length > 0) {
      context += `2. Ý nghĩa của các hào động và sự chuyển biến sang Quẻ Biến.\n`;
    }
    context += `3. Lời khuyên cụ thể cho câu hỏi của người dùng dựa trên triết lý Kinh Dịch.\n`;
    context += `Trình bày rõ ràng, sâu sắc, sử dụng ngôn từ hiện đại dễ hiểu, không quá lạm dụng Hán Việt phức tạp. Trả về định dạng Markdown.`;

    return context;
  }
}

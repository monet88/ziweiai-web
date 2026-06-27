// Glossary thuật ngữ Hán -> Việt dùng chung cho mọi job dịch dữ liệu hệ B6.
// Mục tiêu: ép LLM dịch NHẤT QUÁN các thuật ngữ tử vi / bói toán hay lặp lại
// (đại vận, ngũ hành, can chi, lục thân...) thay vì mỗi batch một kiểu.
//
// Đây KHÔNG phải bảng tra cứu thay thế chuỗi; nó được nhúng vào prompt như một
// ràng buộc dịch. Mọi entry là cặp [Hán, nhãn Việt chuẩn]. Bổ sung dần khi port
// thêm hệ; giữ thứ tự nhóm để dễ rà soát.
export const TRANSLATION_GLOSSARY: ReadonlyArray<readonly [string, string]> = [
  // Ngũ hành
  ['金', 'Kim'],
  ['木', 'Mộc'],
  ['水', 'Thủy'],
  ['火', 'Hỏa'],
  ['土', 'Thổ'],
  // Âm dương
  ['阴', 'Âm'],
  ['阳', 'Dương'],
  // Thiên can
  ['甲', 'Giáp'],
  ['乙', 'Ất'],
  ['丙', 'Bính'],
  ['丁', 'Đinh'],
  ['戊', 'Mậu'],
  ['己', 'Kỷ'],
  ['庚', 'Canh'],
  ['辛', 'Tân'],
  ['壬', 'Nhâm'],
  ['癸', 'Quý'],
  // Địa chi
  ['子', 'Tý'],
  ['丑', 'Sửu'],
  ['寅', 'Dần'],
  ['卯', 'Mão'],
  ['辰', 'Thìn'],
  ['巳', 'Tỵ'],
  ['午', 'Ngọ'],
  ['未', 'Mùi'],
  ['申', 'Thân'],
  ['酉', 'Dậu'],
  ['戌', 'Tuất'],
  ['亥', 'Hợi'],
  // Vận hạn / lá số
  ['大运', 'Đại vận'],
  ['流年', 'Lưu niên'],
  ['流月', 'Lưu nguyệt'],
  ['流日', 'Lưu nhật'],
  ['命宫', 'Cung Mệnh'],
  ['身宫', 'Cung Thân'],
  // Lục thân
  ['父母', 'Phụ mẫu'],
  ['兄弟', 'Huynh đệ'],
  ['官鬼', 'Quan quỷ'],
  ['妻财', 'Thê tài'],
  ['子孙', 'Tử tôn'],
  // Bói toán chung
  ['吉', 'Cát (tốt)'],
  ['凶', 'Hung (xấu)'],
  ['卦', 'Quẻ'],
  ['爻', 'Hào'],
  ['签', 'Quẻ xăm'],
  // Hoàng lịch (#48 / US-040): 12 trực (kiến trừ) - từ đơn dễ dịch lệch nên ghim Hán Việt.
  ['建', 'Kiến'],
  ['除', 'Trừ'],
  ['满', 'Mãn'],
  ['平', 'Bình'],
  ['定', 'Định'],
  ['执', 'Chấp'],
  ['破', 'Phá'],
  ['危', 'Nguy'],
  ['成', 'Thành'],
  ['收', 'Thu'],
  ['开', 'Khai'],
  ['闭', 'Bế'],
  // Hoàng lịch - con giáp 12 (địa chi đã có ở trên; đây là tên con vật).
  ['鼠', 'Chuột'],
  ['牛', 'Trâu'],
  ['虎', 'Hổ'],
  ['兔', 'Mèo'],
  ['龙', 'Rồng'],
  ['蛇', 'Rắn'],
  ['马', 'Ngựa'],
  ['羊', 'Dê'],
  ['猴', 'Khỉ'],
  ['鸡', 'Gà'],
  ['狗', 'Chó'],
  ['猪', 'Lợn'],
];

// Render glossary thành đoạn text nhúng vào prompt. Giữ gọn để không phình token.
export function renderGlossary(glossary: ReadonlyArray<readonly [string, string]> = TRANSLATION_GLOSSARY): string {
  return glossary.map(([han, vi]) => `${han} = ${vi}`).join('; ');
}

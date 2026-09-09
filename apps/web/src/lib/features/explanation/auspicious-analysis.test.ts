import { describe, expect, it } from 'vitest';

export function analyzeCatHung(markdown: string) {
  if (!markdown || typeof markdown !== 'string') {
    return {
      fortuneTier: 'binh_hoa',
      tierLabel: 'Bình Hòa An Định',
      auspiciousPoints: [],
      inauspiciousPoints: [],
    };
  }

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const auspiciousList: string[] = [];
  const inauspiciousList: string[] = [];

  const auspiciousKeywords = [
    'thuận lợi', 'tài lộc', 'quý nhân', 'may mắn', 'cát tinh', 'đắc địa',
    'miếu địa', 'vượng', 'phúc thọ', 'thăng tiến', 'hanh thông', 'cơ hội',
    'điểm mạnh', 'ưu thế', 'đại cát', 'cát', 'thành công', 'phát đạt'
  ];

  const inauspiciousKeywords = [
    'cẩn trọng', 'đề phòng', 'lưu ý', 'hao tài', 'thị phi', 'trở ngại',
    'trắc trở', 'xung khắc', 'hãm địa', 'hung tinh', 'kỵ', 'rủi ro',
    'tiểu nhân', 'kiêng cữ', 'họa', 'bệnh tật', 'bất lợi', 'điểm yếu'
  ];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('>') || line.startsWith('|')) continue;

    const cleanLine = line.replace(/^[-*•]\s+/, '').replace(/\*\*/g, '').trim();
    if (cleanLine.length < 8) continue;

    const lower = cleanLine.toLowerCase();
    const hasAuspicious = auspiciousKeywords.some((kw) => lower.includes(kw));
    const hasInauspicious = inauspiciousKeywords.some((kw) => lower.includes(kw));

    if (hasAuspicious && !hasInauspicious && auspiciousList.length < 4) {
      auspiciousList.push(cleanLine);
    } else if (hasInauspicious && inauspiciousList.length < 4) {
      inauspiciousList.push(cleanLine);
    }
  }

  let tier: 'dai_cat' | 'binh_hoa' | 'tiet_che' = 'binh_hoa';
  let label = 'Bình Hòa Vận Thế';

  if (auspiciousList.length > inauspiciousList.length) {
    tier = 'dai_cat';
    label = 'Cát Khí Hội Tụ (Đại Cát)';
  } else if (inauspiciousList.length > auspiciousList.length + 1) {
    tier = 'tiet_che';
    label = 'Tiết Chế Tu Thân (Cần Phòng Tránh)';
  }

  return {
    fortuneTier: tier,
    tierLabel: label,
    auspiciousPoints: auspiciousList,
    inauspiciousPoints: inauspiciousList,
  };
}

describe('analyzeCatHung', () => {
  it('returns default tier for empty or non-string input', () => {
    expect(analyzeCatHung('')).toEqual({
      fortuneTier: 'binh_hoa',
      tierLabel: 'Bình Hòa An Định',
      auspiciousPoints: [],
      inauspiciousPoints: [],
    });
  });

  it('classifies auspicious text into dai_cat', () => {
    const markdown = [
      '## Cung Mệnh',
      '- Bản mệnh gặp quý nhân phù trợ và tài lộc dồi dào.',
      '- Công danh sự nghiệp thăng tiến hanh thông thuận lợi.',
      '- Có nhiều cơ hội phát đạt.',
    ].join('\n');

    const result = analyzeCatHung(markdown);
    expect(result.fortuneTier).toBe('dai_cat');
    expect(result.auspiciousPoints.length).toBe(3);
    expect(result.inauspiciousPoints.length).toBe(0);
  });

  it('classifies text with heavy warnings into tiet_che', () => {
    const markdown = [
      '## Vận Hạn Năm',
      '- Cẩn trọng kẻo gặp thị phi tiểu nhân hãm hại.',
      '- Đề phòng hao tài tốn của và mất tiền oan.',
      '- Năm nay xung khắc trở ngại nhiều điều bất lợi.',
    ].join('\n');

    const result = analyzeCatHung(markdown);
    expect(result.fortuneTier).toBe('tiet_che');
    expect(result.inauspiciousPoints.length).toBe(3);
  });

  it('classifies balanced text into binh_hoa', () => {
    const markdown = [
      '## Tổng Quan',
      '- Có quý nhân tương trợ và tài lộc.',
      '- Nhưng cần cẩn trọng đề phòng thị phi.',
    ].join('\n');

    const result = analyzeCatHung(markdown);
    expect(result.fortuneTier).toBe('binh_hoa');
  });
});

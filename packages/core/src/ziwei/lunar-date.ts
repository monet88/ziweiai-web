// Chuẩn hóa chuỗi ngày âm lịch dạng Hán (snapshot Ba Tự lưu lunar.toString(),
// hoặc Tử Vi v1 lưu chuỗi gốc) sang định dạng số Việt hóa. Dùng chung cho cả
// tầng API (prompt luận giải) lẫn ứng dụng (hiển thị) để tránh trùng lặp logic.

const lunarMonthMap: Record<string, number> = {
  正: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
  冬: 11,
  腊: 12,
};

const lunarDayMap: Record<string, number> = {
  初一: 1,
  初二: 2,
  初三: 3,
  初四: 4,
  初五: 5,
  初六: 6,
  初七: 7,
  初八: 8,
  初九: 9,
  初十: 10,
  十一: 11,
  十二: 12,
  十三: 13,
  十四: 14,
  十五: 15,
  十六: 16,
  十七: 17,
  十八: 18,
  十九: 19,
  二十: 20,
  廿一: 21,
  廿二: 22,
  廿三: 23,
  廿四: 24,
  廿五: 25,
  廿六: 26,
  廿七: 27,
  廿八: 28,
  廿九: 29,
  三十: 30,
};

const chineseDigitMap: Record<string, string> = {
  〇: '0',
  一: '1',
  二: '2',
  三: '3',
  四: '4',
  五: '5',
  六: '6',
  七: '7',
  八: '8',
  九: '9',
};

const heavenlyStemNamesVi = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
const earthlyBranchNamesVi = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;

export function toSexagenaryYearVi(year: number): string {
  const stemIndex = (((year - 4) % 10) + 10) % 10;
  const branchIndex = (((year - 4) % 12) + 12) % 12;
  return `${heavenlyStemNamesVi[stemIndex]} ${earthlyBranchNamesVi[branchIndex]}`;
}

// Trả về chuỗi gốc nếu không khớp định dạng âm lịch Hán đã biết, để không nuốt
// dữ liệu lạ. Tiền tố 闰 (tháng nhuận) được tách trước khi tra cứu khóa tháng.
export function normalizeLegacyLunarDate(value: string): string {
  const isLeapMonth = value.includes('闰');
  const sanitized = value.replace('闰', '');
  const match = sanitized.match(/^([〇一二三四五六七八九]{4})年(.+?)月(.+)$/u);
  if (!match) {
    return value;
  }

  const month = lunarMonthMap[match[2]];
  const day = lunarDayMap[match[3]];
  if (month === undefined || day === undefined) {
    return value;
  }

  const year = Number(
    match[1]
      .split('')
      .map((character) => chineseDigitMap[character] ?? character)
      .join(''),
  );

  const leapSuffix = isLeapMonth ? ' (nhuận)' : '';
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}${leapSuffix} ${toSexagenaryYearVi(year)}`;
}

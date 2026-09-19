// Pure helpers for share meta + OG image labels (Phase 11 Ticket 3).
// Keep free of Nest/Satori so unit tests stay cheap and deterministic.

export type ShareChartSystem =
  | 'zi-wei-dou-shu'
  | 'ba-zi'
  | 'mangpai'
  | 'mei-hua-yi-shu'
  | 'liu-yao'
  | 'da-liu-ren'
  | 'qi-men-dun-jia'
  | 'tarot'
  | 'mbti'
  | 'face'
  | 'palm'
  | 'lenormand'
  | 'dream'
  | 'sticks'
  | 'almanac'
  | 'hepan'
  | string;

export interface ShareMetaInput {
  chartSystem: ShareChartSystem;
  snapshot?: {
    summary?: Record<string, unknown> | null;
    birth?: {
      originalInput?: {
        sexOrGenderForChart?: string | null;
        date?: { year?: number | null } | null;
      } | null;
      resolvedDateTime?: {
        date?: { year?: number | null } | null;
      } | null;
    } | null;
  } | null;
}

export interface ShareMeta {
  /** Short headline for OG title / H1 */
  title: string;
  /** Full document title with brand */
  documentTitle: string;
  description: string;
  systemName: string;
  genderLabel: string | null;
  yearLabel: string | null;
}

const SYSTEM_LABELS: Record<string, { title: string; systemName: string }> = {
  'zi-wei-dou-shu': { title: 'Lá số Tử Vi', systemName: 'Tử Vi Đẩu Số' },
  'ba-zi': { title: 'Lá số Bát Tự', systemName: 'Bát Tự Tứ Trụ' },
  mangpai: { title: 'Lá số Mạnh Phái', systemName: 'Bát Tự Mạnh Phái' },
  'mei-hua-yi-shu': { title: 'Quẻ Mai Hoa', systemName: 'Mai Hoa Dịch Số' },
  'liu-yao': { title: 'Quẻ Lục Hào', systemName: 'Lục Hào Quái Tượng' },
  'da-liu-ren': { title: 'Quẻ Đại Lục Nhâm', systemName: 'Đại Lục Nhâm' },
  'qi-men-dun-jia': { title: 'Kỳ Môn Độn Giáp', systemName: 'Kỳ Môn Độn Giáp' },
  tarot: { title: 'Trải bài Tarot', systemName: 'Tarot Huyền Bí' },
  mbti: { title: 'Bản đồ MBTI', systemName: 'MBTI Nhân Cách' },
  face: { title: 'Tướng Pháp Diện Tướng', systemName: 'Nhân Tướng Học AI' },
  palm: { title: 'Chỉ Tay Phong Thủy', systemName: 'Thuật Xem Chỉ Tay AI' },
  lenormand: { title: 'Trải bài Lenormand', systemName: 'Lenormand Cổ Điển' },
  dream: { title: 'Giải Mã Giấc Mơ', systemName: 'Chu Công Giải Mộng' },
  sticks: { title: 'Xin Xăm Linh Ứng', systemName: 'Linh Sâm Thánh Mẫu' },
  almanac: { title: 'Lịch Hoàng Đạo & Trạch Cát', systemName: 'Hoàng Đạo Trạch Cát' },
  hepan: { title: 'Hợp Bàn Duyên Số', systemName: 'Hợp Hôn Giao Duyên' },
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function resolveSystemLabels(chartSystem: ShareChartSystem): {
  title: string;
  systemName: string;
} {
  return (
    SYSTEM_LABELS[chartSystem] ?? {
      title: 'Lá số thuật số',
      systemName: 'Tử Vi Toàn Tập',
    }
  );
}

function extractYear(input: ShareMetaInput): string | null {
  const birth = input.snapshot?.birth;
  const fromResolved = birth?.resolvedDateTime?.date?.year;
  if (typeof fromResolved === 'number' && fromResolved > 0) {
    return String(fromResolved);
  }
  const fromInput = birth?.originalInput?.date?.year;
  if (typeof fromInput === 'number' && fromInput > 0) {
    return String(fromInput);
  }
  const solarDate = input.snapshot?.summary?.solarDate;
  if (typeof solarDate === 'string') {
    const match = solarDate.match(/^(\d{4})/);
    if (match) return match[1];
  }
  return null;
}

function extractGender(input: ShareMetaInput): string | null {
  const sex = input.snapshot?.birth?.originalInput?.sexOrGenderForChart;
  if (sex === 'male') return 'Nam Mạng';
  if (sex === 'female') return 'Nữ Mạng';
  const summaryGender = input.snapshot?.summary?.gender ?? input.snapshot?.summary?.genderKey;
  if (typeof summaryGender === 'string' && summaryGender.trim()) {
    const g = summaryGender.toLowerCase();
    if (g.includes('nam') || g === 'male') return 'Nam Mạng';
    if (g.includes('nữ') || g.includes('nu') || g === 'female') return 'Nữ Mạng';
  }
  return null;
}

/**
 * Build Vietnamese share/OG meta from a public chart snapshot.
 * Title format: "Lá số Tử Vi · Nam Mạng · 1992" when extras exist.
 */
export function buildShareMeta(input: ShareMetaInput): ShareMeta {
  const { title: baseTitle, systemName } = resolveSystemLabels(input.chartSystem);
  const genderLabel = extractGender(input);
  const yearLabel = extractYear(input);

  const titleParts = [baseTitle];
  if (genderLabel) titleParts.push(genderLabel);
  if (yearLabel) titleParts.push(yearLabel);
  const title = titleParts.join(' · ');

  const detailBits: string[] = [systemName];
  if (genderLabel) detailBits.push(genderLabel.toLowerCase());
  if (yearLabel) detailBits.push(`sinh năm ${yearLabel}`);

  const description = `Xem luận giải ${detailBits.join(', ')} trên Tử Vi Toàn Tập. Lập lá số, xem lại lịch sử và hỏi đáp AI.`;

  return {
    title,
    documentTitle: `${title} | Tử Vi Toàn Tập`,
    description,
    systemName,
    genderLabel,
    yearLabel,
  };
}

import { describe, expect, it } from 'vitest';
import { buildShareMeta, escapeHtml, resolveSystemLabels } from './share-meta';

describe('share-meta', () => {
  it('resolveSystemLabels maps known systems', () => {
    expect(resolveSystemLabels('zi-wei-dou-shu').systemName).toBe('Tử Vi Đẩu Số');
    expect(resolveSystemLabels('mei-hua-yi-shu').title).toBe('Quẻ Mai Hoa');
    expect(resolveSystemLabels('tarot').systemName).toBe('Tarot Huyền Bí');
    expect(resolveSystemLabels('tarot').title).toBe('Trải bài Tarot');
    expect(resolveSystemLabels('mbti').systemName).toBe('MBTI Nhân Cách');
    expect(resolveSystemLabels('face').title).toBe('Tướng Pháp Diện Tướng');
    expect(resolveSystemLabels('palm').title).toBe('Chỉ Tay Phong Thủy');
    expect(resolveSystemLabels('hepan').systemName).toBe('Hợp Hôn Giao Duyên');
    expect(resolveSystemLabels('sticks').title).toBe('Xin Xăm Linh Ứng');
  });

  it('buildShareMeta includes gender and year when present', () => {
    const meta = buildShareMeta({
      chartSystem: 'zi-wei-dou-shu',
      snapshot: {
        birth: {
          originalInput: {
            sexOrGenderForChart: 'female',
            date: { year: 1992 },
          },
        },
      },
    });

    expect(meta.title).toBe('Lá số Tử Vi · Nữ Mạng · 1992');
    expect(meta.documentTitle).toContain('Tử Vi Toàn Tập');
    expect(meta.description).toContain('Tử Vi Đẩu Số');
    expect(meta.description).toContain('1992');
    expect(meta.genderLabel).toBe('Nữ Mạng');
    expect(meta.yearLabel).toBe('1992');
  });

  it('buildShareMeta falls back when birth extras missing', () => {
    const meta = buildShareMeta({ chartSystem: 'liu-yao', snapshot: null });
    expect(meta.title).toBe('Quẻ Lục Hào');
    expect(meta.genderLabel).toBeNull();
    expect(meta.yearLabel).toBeNull();
  });

  it('escapeHtml neutralizes markup', () => {
    expect(escapeHtml(`A <b>"x"</b> & 'y'`)).toBe(
      'A &lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; &#39;y&#39;',
    );
  });
});

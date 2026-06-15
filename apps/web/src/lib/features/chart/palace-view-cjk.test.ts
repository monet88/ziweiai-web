// Bất biến ngôn ngữ US-006: output bàn 12 cung KHÔNG BAO GIỜ rò chữ Hán.
//   - Snapshot mới (key ASCII) → mọi nhãn là tiếng Việt Latin, 0 ký tự CJK.
//   - Snapshot legacy (displayName Hán) → fallback "Thuật ngữ cũ", không lọt Hán.
// Quét bằng chính CJK_TEXT_PATTERN web dùng để guard (text/cjk.ts).
import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '$lib/text/cjk';
import { buildPalaceView, type PalaceView } from './palace-view-builder';
import type { ChartSnapshot } from '@ziweiai/contracts';

type SnapshotPalace = ChartSnapshot['palaces'][number];

// Gom mọi chuỗi hiển thị của một PalaceView để quét CJK một lượt.
function collectPalaceText(view: PalaceView): string[] {
  const starText = [...view.majorStars, ...view.minorStars, ...view.adjectiveStars].flatMap((star) =>
    [star.name, star.brightness ?? '', star.mutagen ?? ''],
  );
  return [view.name, view.stemBranch, view.changsheng ?? '', view.decadalRange ?? '', ...starText];
}

const canonicalPalace: SnapshotPalace = {
  nameKey: 'soulPalace',
  index: 0,
  heavenlyStemKey: 'jiaHeavenly',
  earthlyBranchKey: 'ziEarthly',
  isBodyPalace: true,
  isOriginalPalace: false,
  majorStars: [{ nameKey: 'ziweiMaj', group: 'major', brightnessKey: 'miao', mutagen: 'lu' }],
  minorStars: [{ nameKey: 'zuofuMin', group: 'minor' }],
  adjectiveStars: [{ nameKey: 'jieshaAdj', group: 'adjective' }],
  changsheng12Key: undefined,
  ages: [2, 14, 26],
};

// Palace legacy v1: synthetic key + displayName Hán (như normalizeLegacyChartSnapshot tạo ra).
const legacyPalace: SnapshotPalace = {
  nameKey: 'legacyPalace0',
  displayName: '命宮',
  index: 0,
  heavenlyStemKey: 'legacyHeavenlyStem0',
  earthlyBranchKey: 'legacyEarthlyBranch0',
  isBodyPalace: false,
  isOriginalPalace: false,
  majorStars: [{ nameKey: 'legacyStar0_0', group: 'major', displayName: '紫微' }],
  minorStars: [],
  adjectiveStars: [],
  ages: [],
};

describe('palace view CJK guard (US-006)', () => {
  it('canonical (key ASCII) palace output dịch tiếng Việt, 0 ký tự CJK', () => {
    const view = buildPalaceView(canonicalPalace);

    expect(view.name).toBe('Mệnh');
    expect(view.stemBranch).toBe('Giáp Tý');
    expect(view.majorStars[0].name).toBe('Tử Vi');
    expect(view.majorStars[0].brightness).toBe('Miếu');
    expect(view.majorStars[0].mutagen).toBe('Lộc');

    for (const text of collectPalaceText(view)) {
      expect(CJK_TEXT_PATTERN.test(text)).toBe(false);
    }
  });

  it('legacy displayName Hán → "Thuật ngữ cũ", không rò Hán ra output', () => {
    const view = buildPalaceView(legacyPalace);

    expect(view.name).toBe('Thuật ngữ cũ');
    expect(view.majorStars[0].name).toBe('Thuật ngữ cũ');

    for (const text of collectPalaceText(view)) {
      expect(CJK_TEXT_PATTERN.test(text)).toBe(false);
    }
  });
});

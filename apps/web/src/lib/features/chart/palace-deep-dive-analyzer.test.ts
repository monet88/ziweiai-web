import { describe, it, expect } from 'vitest';
import { analyzePalace360 } from './palace-deep-dive-analyzer';
import type { PalaceView } from './palace-view-builder';

function createMockPalace(index: number, name: string, branch: string): PalaceView {
  return {
    nameKey: `palace-${index}`,
    name,
    index,
    earthlyBranchKey: branch,
    stemBranch: `Giáp ${branch}`,
    isBodyPalace: index === 1,
    isOriginalPalace: index === 0,
    changsheng: 'Đế Vượng',
    decadalRange: '22-31',
    ages: [22, 34, 46],
    majorStars: [
      { key: 'ziwei', name: 'Tử Vi', group: 'major', brightness: 'Miếu', mutagen: null },
      { key: 'tianfu', name: 'Thiên Phủ', group: 'major', brightness: 'Vượng', mutagen: null },
    ],
    minorStars: [
      { key: 'zuofu', name: 'Tả Phù', group: 'minor', brightness: null, mutagen: null },
      { key: 'youbi', name: 'Hữu Bật', group: 'minor', brightness: null, mutagen: null },
    ],
    adjectiveStars: [],
  };
}

describe('palace-deep-dive-analyzer', () => {
  const mockPalaces: PalaceView[] = [
    createMockPalace(0, 'Mệnh', 'Tý'),
    createMockPalace(1, 'Phụ Mẫu', 'Sửu'),
    createMockPalace(2, 'Phúc Đức', 'Dần'),
    createMockPalace(3, 'Điền Trạch', 'Mão'),
    createMockPalace(4, 'Quan Lộc', 'Thìn'),
    createMockPalace(5, 'Nô Bộc', 'Tỵ'),
    createMockPalace(6, 'Thiên Di', 'Ngọ'),
    createMockPalace(7, 'Tật Ách', 'Mùi'),
    createMockPalace(8, 'Tài Bạch', 'Thân'),
    createMockPalace(9, 'Tử Tức', 'Dậu'),
    createMockPalace(10, 'Phu Thê', 'Tuất'),
    createMockPalace(11, 'Huynh Đệ', 'Hợi'),
  ];

  it('should correctly determine opposite and trine aspects', () => {
    const menhPalace = mockPalaces[0];
    const analysis = analyzePalace360(menhPalace, mockPalaces);

    expect(analysis.palaceNameVi).toBe('Mệnh');
    expect(analysis.vigorScore).toBeGreaterThan(60);
    // Cung đối xung của Mệnh (0) là Thiên Di (6)
    expect(analysis.aspects.opposite.nameVi).toBe('Thiên Di');
    // Tam hợp của Mệnh (0) là Quan Lộc (4) và Tài Bạch (8)
    expect(analysis.aspects.trine1.nameVi).toBe('Quan Lộc');
    expect(analysis.aspects.trine2.nameVi).toBe('Tài Bạch');
    // Cung giáp sườn: Huynh Đệ (11) và Phụ Mẫu (1)
    expect(analysis.aspects.flanking[0].nameVi).toBe('Huynh Đệ');
    expect(analysis.aspects.flanking[1].nameVi).toBe('Phụ Mẫu');
  });

  it('should generate audio narrative script and remedy advice', () => {
    const taiPalace = mockPalaces[8]; // Tài Bạch
    const analysis = analyzePalace360(taiPalace, mockPalaces);

    expect(analysis.remedy.energySummary).toContain('dòng lưu chuyển tài lộc');
    expect(analysis.remedy.actionAdvice.length).toBeGreaterThan(0);
    expect(analysis.remedy.fengShuiTips.length).toBeGreaterThan(0);
    expect(analysis.audioNarrativeScript).toContain('Thính Luận Hoàng Triều');
    expect(analysis.audioNarrativeScript).toContain('Tài Bạch');
  });
});

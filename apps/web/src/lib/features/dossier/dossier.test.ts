import { describe, expect, it } from 'vitest';
import { buildDossierData } from './dossier-interpretations';
import { formatRoyalSecurityCode } from './dossier-pdf-exporter';

describe('Dossier Interpretations Generator', () => {
  const mockSnapshot: any = {
    summary: {
      solarDate: '1995-10-24',
      lunarDate: 'Ất Hợi, Tháng 9, Ngày 1',
      destinyElement: 'Sơn Đầu Hỏa',
      fiveElementsClass: 'Hỏa Lục Cục',
      destinyYinYang: 'Âm Nam',
      bodyPalace: 'Cung Tài Bạch',
      destinyMaster: 'Cự Môn',
      bodyMaster: 'Thiên Cơ',
      yearPillar: 'Ất Hợi',
      monthPillar: 'Bính Tuất',
      dayPillar: 'Tân Mão',
      hourPillar: 'Đinh Dậu',
    },
    birth: {
      name: 'Nguyễn Văn An',
      gender: 'male',
      solarDate: '1995-10-24',
    },
    palaces: [
      {
        displayName: 'Mệnh',
        earthlyBranchKey: 'earthlyBranch_hoi',
        heavenlyStemKey: 'heavenlyStem_dinh',
        isBodyPalace: false,
        majorStars: [
          { name: 'Tử Vi', brightnessKey: 'miao', mutagenKey: 'khoa' },
          { name: 'Thất Sát', brightnessKey: 'wang' },
        ],
        minorStars: [{ name: 'Văn Xương' }, { name: 'Thiên Khôi' }],
        adjectiveStars: [{ name: 'Hóa Quyền' }],
      },
      {
        displayName: 'Tài Bạch',
        earthlyBranchKey: 'earthlyBranch_mao',
        heavenlyStemKey: 'heavenlyStem_ky',
        isBodyPalace: true,
        majorStars: [{ name: 'Vũ Khúc', brightnessKey: 'miao', mutagenKey: 'lu' }],
        minorStars: [{ name: 'Tả Phụ' }],
        adjectiveStars: [],
      },
    ],
  };

  it('builds dossier payload with 19 pages data and user info', () => {
    const payload = buildDossierData(mockSnapshot);

    expect(payload.userName).toBe('Nguyễn Văn An');
    expect(payload.genderText).toBe('Nam Mạng');
    expect(payload.destinyElementText).toBe('Sơn Đầu Hỏa');
    expect(payload.baziYear).toBe('Ất Hợi');
    expect(payload.palaces).toHaveLength(2);

    const menh = payload.palaces[0];
    expect(menh.name).toBe('Mệnh');
    expect(menh.earthlyBranch).toBe('hoi');
    expect(menh.majorStars[0].name).toBe('Tử Vi');
    expect(menh.majorStars[0].brightness).toBe('Miếu');
    expect(menh.majorStars[0].mutagen).toBe('Hóa Khoa');
    expect(menh.goodStars).toContain('Văn Xương');
    expect(menh.goodStars).toContain('Thiên Khôi');
    expect(menh.essenceReading).toContain('Cung Mệnh');

    const taiBach = payload.palaces[1];
    expect(taiBach.isBody).toBe(true);
    expect(taiBach.essenceReading).toContain('THÂN CƯ');

    expect(payload.yearly2026.yearCanChi).toContain('2026');
    expect(payload.yearly2026.thaiTuePalace).toContain('Ngọ');
  });

  it('correctly translates key-based snapshot (ASCII keys) into Vietnamese', () => {
    const keyBasedSnapshot: any = {
      summary: {
        solarDate: '1998-03-16',
        lunarDate: { year: 1998, month: 2, day: 18, isLeapMonth: false },
        fiveElementsClassKey: 'water2nd',
        bodyPalaceNameKey: 'soulPalace',
        lifeMasterKey: 'ziweiMaj',
        bodyMasterKey: 'tianxiangMaj',
        timeEarthlyBranchKey: 'siEarthly',
      },
      birth: {
        name: 'galaxypro710',
        gender: 'female',
        resolvedDateTime: { date: { year: 1998, month: 3, day: 16 } },
      },
      palaces: [
        {
          nameKey: 'soulPalace',
          earthlyBranchKey: 'siEarthly',
          heavenlyStemKey: 'jiHeavenly',
          isBodyPalace: true,
          majorStars: [
            { nameKey: 'taiyangMaj', brightnessKey: 'de' },
            { nameKey: 'taiyinMaj', brightnessKey: 'bu' },
          ],
          minorStars: [{ nameKey: 'lucunMin' }],
          adjectiveStars: [],
        },
      ],
    };

    const payload = buildDossierData(keyBasedSnapshot);
    expect(payload.userName).toBe('galaxypro710');
    expect(payload.genderText).toBe('Nữ Mạng');
    expect(payload.fiveElementsClassText).toBe('Thủy Nhị Cục');
    expect(payload.bodyPalaceText).toBe('Mệnh');
    expect(payload.masterStarText).toBe('Tử Vi');
    expect(payload.bodyMasterStarText).toBe('Thiên Tướng');
    expect(payload.baziYear).toBe('Mậu Dần');
    expect(payload.baziHour).toBe('Giờ Tỵ');

    const palace = payload.palaces[0];
    expect(palace.name).toBe('Mệnh');
    expect(palace.earthlyBranch).toBe('Tỵ');
    expect(palace.heavenlyStem).toBe('Kỷ');
    expect(palace.earthlyBranchKey).toBe('siEarthly');
    expect(palace.majorStars[0].name).toBe('Thái Dương');
    expect(palace.majorStars[0].brightness).toBe('Đắc');
    expect(palace.majorStars[1].name).toBe('Thái Âm');
    expect(palace.goodStars).toContain('Lộc Tồn');
  });
});

import { createDossierModel } from './dossier-model.svelte';
import { setCachedDossier, clearCachedDossier } from './dossier-cache';

describe('createDossierModel with cache', () => {
  it('retrieves unlocked status from local cache without needing access token', async () => {
    const chartId = 'cached-chart-offline-test';
    await setCachedDossier(chartId, { userName: 'Tiêu Phong' });

    const mockAuth: any = {
      getAccessToken: () => null,
      isAnonymous: true,
      user: null,
    };

    const model = createDossierModel({
      auth: mockAuth,
      getChartId: () => chartId,
    });

    const status = await model.checkStatus();
    expect(status).toBe(true);
    expect(model.isUnlocked).toBe(true);

    await clearCachedDossier(chartId);
  });

  it('guarantees personalized watermark integrity and royal security code format', () => {
    const chartId = '7f8a9b1c-2d3e-4f5a-6b7c-8d9e0f1a2b3c';
    const userName = 'Hoàng Thùy Linh';
    const minimalSnapshot: any = {
      summary: {},
      birth: { name: userName },
      palaces: [],
    };
    const payload = buildDossierData(minimalSnapshot, userName);

    expect(payload.userName).toBe('Hoàng Thùy Linh');
    expect(payload.userName.toUpperCase()).toBe('HOÀNG THÙY LINH');
    expect(formatRoyalSecurityCode(chartId)).toBe('VIOS-ROYAL-7F8A9B1C');
  });
});


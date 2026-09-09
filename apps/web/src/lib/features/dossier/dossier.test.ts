import { describe, expect, it } from 'vitest';
import { buildDossierData } from './dossier-interpretations';

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

  it('handles fallback defaults gracefully when fields are missing', () => {
    const minimalSnapshot: any = {
      summary: {},
      birth: {},
      palaces: [],
    };

    const payload = buildDossierData(minimalSnapshot);
    expect(payload.userName).toBe('Đương Số Hoàng Triều');
    expect(payload.genderText).toBe('Bản Mệnh');
    expect(payload.palaces).toHaveLength(0);
    expect(payload.yearly2026.analysis).toBeDefined();
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
});


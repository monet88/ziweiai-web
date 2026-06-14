import { afterEach, describe, expect, it, vi } from 'vitest';
import { CJK_TEXT_PATTERN } from '@ziweiai/core';
import { buildExplanationPrompt } from './ai-explanation-provider';

describe('GeminiExplanationProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GEMINI_SDK_BASE_URL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  it('treats native responses without parts as an unavailable Gemini result instead of crashing', async () => {
    process.env.GEMINI_API_KEY = 'monet-4292';
    process.env.GEMINI_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ candidates: [{ content: {} }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const { GeminiExplanationProvider } = await import('./gemini-explanation-provider');
    const provider = new GeminiExplanationProvider();

    await expect(
      provider.generateExplanation({
        chartSnapshot: {
          snapshotId: 'fixture',
          birth: {
            originalInput: {
              calendar: 'gregorian',
              date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
              time: { hour: 8, minute: 30, isUnknown: false },
              sexOrGenderForChart: 'female',
              place: { label: 'Manual', manual: { latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh' } },
              locale: 'vi-VN',
              source: 'test-fixture',
            },
            resolvedDateTime: {
              date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
              time: { hour: 8, minute: 30, isUnknown: false },
              utcInstant: '1990-01-01T01:30:00.000Z',
            },
            resolvedLocation: { label: 'Manual', latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh', resolver: 'manual' },
            lunarDate: null,
            ganZhi: { yearPillar: null, monthPillar: null, dayPillar: null, hourPillar: null },
            trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'medium' },
            normalizationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
          },
          chartSystem: 'ba-zi',
          palaces: [],
          pillars: [],
          summary: { lunarDate: '1990-01-01', mingGong: '甲子', shenGong: '乙丑' },
          engineVersion: {
            enginePackage: '@ziweiai/astro-engine',
            engineSemver: '0.1.0',
            adapterVersions: [],
            fixtureSetVersion: 'phase-3-fixtures-v1',
            schemaVersion: 'phase-3-contracts-v2',
          },
          ruleSource: {
            system: 'ba-zi',
            canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
            ruleSet: 'phase-3-default',
            schoolNotes: null,
            sourcePriority: 'lunar-javascript-first',
          },
          inputHash: { algorithm: 'sha256', digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' },
          calculationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
          provenance: {
            referenceRepos: ['.ref/lunar-javascript'],
            runtimeLibraries: [{ name: 'lunar-javascript', version: '1.7.7' }],
            adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
            fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
            calculationTimestamp: '2026-06-03T00:00:00.000Z',
            warnings: [],
          },
          createdAt: '2026-06-03T00:00:00.000Z',
        },
        explanationKind: 'overview',
        explanationContext: {
          chartSystem: 'ba-zi',
          visibleMessageKeys: ['birth.time.verified'],
          confidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
          sourceLabel: 'lunar-javascript@1.7.7',
        },
      }),
    ).rejects.toThrow('Gemini không trả về nội dung luận giải.');
  });

  it('uses the native Gemini SDK endpoint by default', async () => {
    const originalLoadEnvFile = process.loadEnvFile;
    // Chặn test này nạp lại .env local để giữ đúng case fallback host Google gốc.
    // @ts-expect-error Node exposes loadEnvFile at runtime in this project.
    process.loadEnvFile = undefined;
    try {
      delete process.env.GEMINI_SDK_BASE_URL;
      process.env.GEMINI_API_KEY = 'monet-4292';
      process.env.GEMINI_MODEL = 'gemini-3.1-flash-lite';
      vi.resetModules();

      const fetchMock = vi.fn(async (_input: string | URL | globalThis.Request, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'ok native' }] } }],
            usageMetadata: { totalTokenCount: 7, promptTokenCount: 5, candidatesTokenCount: 2 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
      vi.stubGlobal('fetch', fetchMock);

      const { GeminiExplanationProvider } = await import('./gemini-explanation-provider');
      const provider = new GeminiExplanationProvider();
      const result = await provider.generateExplanation({
        chartSnapshot: {
          snapshotId: 'fixture',
          birth: {
            originalInput: {
              calendar: 'gregorian',
              date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
              time: { hour: 8, minute: 30, isUnknown: false },
              sexOrGenderForChart: 'female',
              place: { label: 'Manual', manual: { latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh' } },
              locale: 'vi-VN',
              source: 'test-fixture',
            },
            resolvedDateTime: {
              date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
              time: { hour: 8, minute: 30, isUnknown: false },
              utcInstant: '1990-01-01T01:30:00.000Z',
            },
            resolvedLocation: { label: 'Manual', latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh', resolver: 'manual' },
            lunarDate: null,
            ganZhi: { yearPillar: null, monthPillar: null, dayPillar: null, hourPillar: null },
            trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'medium' },
            normalizationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
          },
          chartSystem: 'ba-zi',
          palaces: [],
          pillars: [],
          summary: {},
          engineVersion: {
            enginePackage: '@ziweiai/astro-engine',
            engineSemver: '0.1.0',
            adapterVersions: [],
            fixtureSetVersion: 'phase-3-fixtures-v1',
            schemaVersion: 'phase-3-contracts-v1',
          },
          ruleSource: {
            system: 'ba-zi',
            canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
            ruleSet: 'phase-3-default',
            schoolNotes: null,
            sourcePriority: 'lunar-javascript-first',
          },
          inputHash: { algorithm: 'sha256', digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' },
          calculationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
          provenance: {
            referenceRepos: ['.ref/lunar-javascript'],
            runtimeLibraries: [{ name: 'lunar-javascript', version: '1.7.7' }],
            adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
            fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
            calculationTimestamp: '2026-06-03T00:00:00.000Z',
            warnings: [],
          },
          createdAt: '2026-06-03T00:00:00.000Z',
        },
        explanationKind: 'overview',
        explanationContext: {
          chartSystem: 'ba-zi',
          visibleMessageKeys: ['birth.time.verified'],
          confidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
          sourceLabel: 'lunar-javascript@1.7.7',
        },
      });

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0]?.[0]).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent');
      expect(result.renderedMarkdown).toBe('ok native');
      expect(result.providerMetadata.model).toBe('gemini-3.1-flash-lite');
    } finally {
      process.loadEnvFile = originalLoadEnvFile;
    }
  });

  it('uses the custom Gemini SDK endpoint with Bearer auth when GEMINI_SDK_BASE_URL is configured', async () => {
    process.env.GEMINI_SDK_BASE_URL = 'https://vps.monet.uno/api-cli/';
    process.env.GEMINI_API_KEY = 'sk-test-key';
    process.env.GEMINI_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    const fetchMock = vi.fn(async (_input: string | URL | globalThis.Request, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'ok custom native' }] } }],
          usageMetadata: { totalTokenCount: 7, promptTokenCount: 5, candidatesTokenCount: 2 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { GeminiExplanationProvider } = await import('./gemini-explanation-provider');
    const provider = new GeminiExplanationProvider();
    const result = await provider.generateExplanation({
      chartSnapshot: {
        snapshotId: 'fixture',
        birth: {
          originalInput: {
            calendar: 'gregorian',
            date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
            time: { hour: 8, minute: 30, isUnknown: false },
            sexOrGenderForChart: 'female',
            place: { label: 'Manual', manual: { latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh' } },
            locale: 'vi-VN',
            source: 'test-fixture',
          },
          resolvedDateTime: {
            date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
            time: { hour: 8, minute: 30, isUnknown: false },
            utcInstant: '1990-01-01T01:30:00.000Z',
          },
          resolvedLocation: { label: 'Manual', latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh', resolver: 'manual' },
          lunarDate: null,
          ganZhi: { yearPillar: null, monthPillar: null, dayPillar: null, hourPillar: null },
          trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'medium' },
          normalizationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        },
        chartSystem: 'ba-zi',
        palaces: [],
        pillars: [],
        summary: {},
        engineVersion: {
          enginePackage: '@ziweiai/astro-engine',
          engineSemver: '0.1.0',
          adapterVersions: [],
          fixtureSetVersion: 'phase-3-fixtures-v1',
          schemaVersion: 'phase-3-contracts-v1',
        },
        ruleSource: {
          system: 'ba-zi',
          canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
          ruleSet: 'phase-3-default',
          schoolNotes: null,
          sourcePriority: 'lunar-javascript-first',
        },
        inputHash: { algorithm: 'sha256', digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' },
        calculationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        provenance: {
          referenceRepos: ['.ref/lunar-javascript'],
          runtimeLibraries: [{ name: 'lunar-javascript', version: '1.7.7' }],
          adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
          fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
          calculationTimestamp: '2026-06-03T00:00:00.000Z',
          warnings: [],
        },
        createdAt: '2026-06-03T00:00:00.000Z',
      },
      explanationKind: 'overview',
      explanationContext: {
        chartSystem: 'ba-zi',
        visibleMessageKeys: ['birth.time.verified'],
        confidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        sourceLabel: 'lunar-javascript@1.7.7',
      },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://vps.monet.uno/api-cli/v1beta/models/gemini-3.1-flash-lite:generateContent');
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers).toEqual({
      Authorization: 'Bearer sk-test-key',
      'Content-Type': 'application/json',
    });
    expect(result.renderedMarkdown).toBe('ok custom native');
    expect(result.providerMetadata.model).toBe('gemini-3.1-flash-lite');
  });

  it('builds a Vietnamese prompt without Han-script chart text', () => {
    const prompt = buildExplanationPrompt({
      chartSnapshot: {
        snapshotId: 'fixture',
        birth: {
          originalInput: {
            calendar: 'gregorian',
            date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
            time: { hour: 9, minute: 30, isUnknown: false },
            sexOrGenderForChart: 'female',
            place: { label: 'Ho Chi Minh City', manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' } },
            locale: 'vi-VN',
            source: 'user-entered',
          },
          resolvedDateTime: {
            date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
            time: { hour: 9, minute: 30, isUnknown: false },
            utcInstant: '1992-08-14T02:30:00.000Z',
          },
          resolvedLocation: { label: 'Ho Chi Minh City', latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh', resolver: 'manual' },
          lunarDate: null,
          ganZhi: { yearPillar: null, monthPillar: null, dayPillar: null, hourPillar: null },
          trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'medium' },
          normalizationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        },
        chartSystem: 'zi-wei-dou-shu',
        palaces: [
          {
            nameKey: 'siblingPalace',
            index: 0,
            heavenlyStemKey: 'jiaHeavenly',
            earthlyBranchKey: 'maoEarthly',
            isBodyPalace: false,
            isOriginalPalace: false,
            majorStars: [
              { nameKey: 'taiyangMaj', group: 'major' },
              { nameKey: 'jumenMaj', group: 'major' },
            ],
            minorStars: [],
            adjectiveStars: [],
            ages: [],
          },
        ],
        pillars: [{ name: 'Soul', value: 'maoEarthly' }],
        summary: {
          gender: '女',
          lunarDate: '一九九二年闰十一月初一',
          sign: '狮子座',
          solarDate: '1992-8-14',
          time: '巳时',
          zodiac: '猴',
        },
        horoscope: {
          decadal: { index: 0, heavenlyStemKey: 'jiaHeavenly', earthlyBranchKey: 'ziEarthly', palaceNameKeys: ['soulPalace'], mutagenStarKeys: ['ziweiMaj'] },
          age: { index: 1, nominalAge: 33 },
          yearly: { index: 2, heavenlyStemKey: 'yiHeavenly', earthlyBranchKey: 'chouEarthly', palaceNameKeys: ['wealthPalace'], mutagenStarKeys: ['wuquMaj'] },
        },
        engineVersion: {
          enginePackage: '@ziweiai/astro-engine',
          engineSemver: '0.1.0',
          adapterVersions: [],
          fixtureSetVersion: 'phase-3-fixtures-v1',
          schemaVersion: 'phase-3-contracts-v1',
        },
        ruleSource: {
          system: 'zi-wei-dou-shu',
          canonicalLibrary: { name: 'iztro', version: '2.5.8' },
          ruleSet: 'phase-3-default',
          schoolNotes: null,
          sourcePriority: 'iztro-first',
        },
        inputHash: { algorithm: 'sha256', digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' },
        calculationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        provenance: {
          referenceRepos: ['.ref/iztro'],
          runtimeLibraries: [{ name: 'iztro', version: '2.5.8' }],
          adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
          fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
          calculationTimestamp: '2026-06-03T00:00:00.000Z',
          warnings: [],
        },
        createdAt: '2026-06-03T00:00:00.000Z',
      },
      explanationKind: 'overview',
      explanationContext: {
        chartSystem: 'zi-wei-dou-shu',
        visibleMessageKeys: ['birth.time.verified'],
        confidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        sourceLabel: 'iztro@2.5.8',
      },
    });

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('sibling Palace');
    expect(prompt).toContain('Thái Dương');
    expect(prompt).toContain('01/11/1992 (nhuận) Nhâm Thân');
    expect(prompt).toContain('Đại vận:');
    expect(prompt).toContain('Lưu niên:');
    expect(prompt).toContain('Tiểu vận: tuổi 33');
  });

  it('builds a dedicated Bát Tự prompt from structured payload without Han-script text', () => {
    const prompt = buildExplanationPrompt({
      chartSnapshot: {
        snapshotId: 'fixture-bazi',
        birth: {
          originalInput: {
            calendar: 'gregorian',
            date: { year: 2005, month: 12, day: 23, isLeapMonth: null },
            time: { hour: 8, minute: 37, isUnknown: false },
            sexOrGenderForChart: 'female',
            place: { label: 'Manual', manual: { latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh' } },
            locale: 'vi-VN',
            source: 'test-fixture',
          },
          resolvedDateTime: {
            date: { year: 2005, month: 12, day: 23, isLeapMonth: null },
            time: { hour: 8, minute: 37, isUnknown: false },
            utcInstant: '2005-12-23T01:37:00.000Z',
          },
          resolvedLocation: { label: 'Manual', latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh', resolver: 'manual' },
          lunarDate: '二〇〇五年十一月廿三',
          ganZhi: { yearPillar: '乙酉', monthPillar: '戊子', dayPillar: '庚午', hourPillar: '庚辰' },
          trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'medium' },
          normalizationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        },
        chartSystem: 'ba-zi',
        palaces: [],
        pillars: [
          { name: 'year', value: 'Ất Dậu' },
          { name: 'month', value: 'Mậu Tý' },
          { name: 'day', value: 'Canh Ngọ' },
          { name: 'hour', value: 'Canh Thìn' },
        ],
        summary: {
          lunarDate: '2005-11-23',
          mingGong: 'Kỷ Sửu',
          shenGong: 'Nhâm Ngọ',
          dayMaster: 'Canh Ngọ',
          taiYuan: 'Kỷ Mão',
          taiXi: 'Ất Mùi',
        },
        bazi: {
          dayMasterHeavenlyStemKey: 'gengHeavenly',
          pillars: [
            {
              slot: 'year',
              heavenlyStemKey: 'yiHeavenly',
              earthlyBranchKey: 'youEarthly',
              heavenlyStemElementKey: 'wood',
              earthlyBranchElementKey: 'metal',
              heavenlyStemTenGodKey: 'zhengCai',
              earthlyBranchTenGodKeys: ['jieCai'],
              hiddenStems: [{ heavenlyStemKey: 'xinHeavenly', elementKey: 'metal', tenGodKey: 'jieCai' }],
              naYin: 'Tuyền Trung Thủy',
            },
            {
              slot: 'month',
              heavenlyStemKey: 'wuHeavenly',
              earthlyBranchKey: 'ziEarthly',
              heavenlyStemElementKey: 'earth',
              earthlyBranchElementKey: 'water',
              heavenlyStemTenGodKey: 'pianYin',
              earthlyBranchTenGodKeys: ['shangGuan'],
              hiddenStems: [{ heavenlyStemKey: 'guiHeavenly', elementKey: 'water', tenGodKey: 'shangGuan' }],
              naYin: 'Tích Lịch Hỏa',
            },
            {
              slot: 'day',
              heavenlyStemKey: 'gengHeavenly',
              earthlyBranchKey: 'wuEarthly',
              heavenlyStemElementKey: 'metal',
              earthlyBranchElementKey: 'fire',
              heavenlyStemTenGodKey: 'riZhu',
              earthlyBranchTenGodKeys: ['zhengGuan', 'zhengYin'],
              hiddenStems: [
                { heavenlyStemKey: 'dingHeavenly', elementKey: 'fire', tenGodKey: 'zhengGuan' },
                { heavenlyStemKey: 'jiHeavenly', elementKey: 'earth', tenGodKey: 'zhengYin' },
              ],
              naYin: 'Lộ Bàng Thổ',
            },
            {
              slot: 'hour',
              heavenlyStemKey: 'gengHeavenly',
              earthlyBranchKey: 'chenEarthly',
              heavenlyStemElementKey: 'metal',
              earthlyBranchElementKey: 'earth',
              heavenlyStemTenGodKey: 'biJian',
              earthlyBranchTenGodKeys: ['pianYin', 'zhengCai', 'shangGuan'],
              hiddenStems: [
                { heavenlyStemKey: 'wuHeavenly', elementKey: 'earth', tenGodKey: 'pianYin' },
                { heavenlyStemKey: 'yiHeavenly', elementKey: 'wood', tenGodKey: 'zhengCai' },
                { heavenlyStemKey: 'guiHeavenly', elementKey: 'water', tenGodKey: 'shangGuan' },
              ],
              naYin: 'Bạch Lạp Kim',
            },
          ],
          taiYuan: { heavenlyStemKey: 'jiHeavenly', earthlyBranchKey: 'maoEarthly', naYin: 'Thành Đầu Thổ' },
          taiXi: { heavenlyStemKey: 'yiHeavenly', earthlyBranchKey: 'weiEarthly', naYin: 'Sa Trung Kim' },
          mingGong: { heavenlyStemKey: 'jiHeavenly', earthlyBranchKey: 'chouEarthly', naYin: 'Tích Lịch Hỏa' },
          shenGong: { heavenlyStemKey: 'renHeavenly', earthlyBranchKey: 'wuEarthly', naYin: 'Dương Liễu Mộc' },
        },
        engineVersion: {
          enginePackage: '@ziweiai/astro-engine',
          engineSemver: '0.1.0',
          adapterVersions: [],
          fixtureSetVersion: 'phase-3-fixtures-v1',
          schemaVersion: 'phase-3-contracts-v3',
        },
        ruleSource: {
          system: 'ba-zi',
          canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
          ruleSet: 'phase-3-default',
          schoolNotes: null,
          sourcePriority: 'lunar-javascript-first',
        },
        inputHash: { algorithm: 'sha256', digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' },
        calculationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        provenance: {
          referenceRepos: ['.ref/lunar-javascript'],
          runtimeLibraries: [{ name: 'lunar-javascript', version: '1.7.7' }],
          adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
          fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
          calculationTimestamp: '2026-06-11T17:30:00.000Z',
          warnings: [],
        },
        createdAt: '2026-06-11T17:30:00.000Z',
      },
      explanationKind: 'overview',
      explanationContext: {
        chartSystem: 'ba-zi',
        visibleMessageKeys: ['birth.time.verified'],
        confidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        sourceLabel: 'lunar-javascript@1.7.7',
      },
    });

    expect(prompt).toContain('Ngày chủ: Canh');
    expect(prompt).toContain('Tứ trụ chi tiết');
    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('builds a dedicated Mai Hoa prompt from structured payload without Han-script text', () => {
    const prompt = buildExplanationPrompt({
      chartSnapshot: {
        snapshotId: 'fixture-meihua',
        birth: {
          originalInput: {
            calendar: 'gregorian',
            date: { year: 2026, month: 6, day: 12, isLeapMonth: null },
            time: { hour: 9, minute: 15, isUnknown: false },
            sexOrGenderForChart: 'female',
            place: { label: 'Manual', manual: { latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh' } },
            locale: 'vi-VN',
            source: 'test-fixture',
          },
          resolvedDateTime: {
            date: { year: 2026, month: 6, day: 12, isLeapMonth: null },
            time: { hour: 9, minute: 15, isUnknown: false },
            utcInstant: '2026-06-12T02:15:00.000Z',
          },
          resolvedLocation: { label: 'Manual', latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh', resolver: 'manual' },
          lunarDate: '二〇二六年四月廿七',
          ganZhi: { yearPillar: '丙午', monthPillar: '甲午', dayPillar: '辛亥', hourPillar: '癸巳' },
          trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'medium' },
          normalizationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        },
        chartSystem: 'mei-hua-yi-shu',
        palaces: [],
        pillars: [],
        summary: {
          method: 'Theo thời gian',
          mainHexagram: 'Ly trên Càn',
          changedHexagram: 'Khảm trên Càn',
          nuclearHexagram: 'Tốn trên Đoài',
          movingLine: 'Hào 3',
          bodyTrigram: 'Ly',
          useTrigram: 'Càn',
          relation: 'Thể khắc dụng, bạn nắm quyền chủ động nhưng cần trả giá bằng công sức.',
        },
        meihua: {
          method: 'time-based',
          guaCode: 331,
          movingLine: 3,
          mainHexagram: {
            key: 'li-over-qian',
            topTrigramKey: 'liTrigram',
            bottomTrigramKey: 'qianTrigram',
            lines: [
              { position: 1, value: 'yang', isMoving: false },
              { position: 2, value: 'yang', isMoving: false },
              { position: 3, value: 'yang', isMoving: true },
              { position: 4, value: 'yang', isMoving: false },
              { position: 5, value: 'yin', isMoving: false },
              { position: 6, value: 'yang', isMoving: false },
            ],
          },
          changedHexagram: {
            key: 'kan-over-qian',
            topTrigramKey: 'kanTrigram',
            bottomTrigramKey: 'qianTrigram',
            lines: [
              { position: 1, value: 'yang', isMoving: false },
              { position: 2, value: 'yang', isMoving: false },
              { position: 3, value: 'yin', isMoving: true },
              { position: 4, value: 'yin', isMoving: false },
              { position: 5, value: 'yang', isMoving: false },
              { position: 6, value: 'yin', isMoving: false },
            ],
          },
          nuclearHexagram: {
            key: 'xun-over-dui',
            topTrigramKey: 'xunTrigram',
            bottomTrigramKey: 'duiTrigram',
            lines: [
              { position: 1, value: 'yang', isMoving: false },
              { position: 2, value: 'yang', isMoving: false },
              { position: 3, value: 'yang', isMoving: false },
              { position: 4, value: 'yin', isMoving: false },
              { position: 5, value: 'yang', isMoving: false },
              { position: 6, value: 'yang', isMoving: false },
            ],
          },
          bodyTrigramKey: 'liTrigram',
          useTrigramKey: 'qianTrigram',
          bodyElementKey: 'fire',
          useElementKey: 'metal',
          relationKey: 'bodyControlsUse',
        },
        engineVersion: {
          enginePackage: '@ziweiai/astro-engine',
          engineSemver: '0.1.0',
          adapterVersions: [],
          fixtureSetVersion: 'phase-4-fixtures-v1',
          schemaVersion: 'phase-4-contracts-v1',
        },
        ruleSource: {
          system: 'mei-hua-yi-shu',
          canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
          ruleSet: 'phase-4-default',
          schoolNotes: null,
          sourcePriority: 'lunar-javascript-first',
        },
        inputHash: { algorithm: 'sha256', digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' },
        calculationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        provenance: {
          referenceRepos: ['.ref/xuanshu', '.ref/lunar-javascript'],
          runtimeLibraries: [{ name: 'lunar-javascript', version: '1.7.7' }],
          adapterConfig: [{ key: 'configProfile', value: 'phase-4-default' }],
          fixtureEvidence: { fixtureSetId: 'phase-4-fixtures-v1', passed: true },
          calculationTimestamp: '2026-06-12T02:15:00.000Z',
          warnings: [],
        },
        createdAt: '2026-06-12T02:15:00.000Z',
      },
      explanationKind: 'career',
      explanationContext: {
        chartSystem: 'mei-hua-yi-shu',
        visibleMessageKeys: ['birth.time.verified'],
        confidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        sourceLabel: 'lunar-javascript@1.7.7',
      },
    });

    expect(prompt).toContain('Quẻ chính: Ly trên Càn');
    expect(prompt).toContain('Quan hệ thể dụng: Thể khắc dụng');
    expect(prompt).toContain('Cấu trúc quẻ chính:');
    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('builds a dedicated Lục Hào prompt from structured payload without Han-script text', () => {
    const prompt = buildExplanationPrompt({
      chartSnapshot: {
        snapshotId: 'fixture-liuyao',
        birth: {
          originalInput: {
            calendar: 'gregorian',
            date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
            time: { hour: 0, minute: 0, isUnknown: false },
            sexOrGenderForChart: 'female',
            place: { label: 'Manual', manual: { latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh' } },
            locale: 'vi-VN',
            source: 'test-fixture',
          },
          resolvedDateTime: {
            date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
            time: { hour: 0, minute: 0, isUnknown: false },
            utcInstant: '1990-01-01T00:00:00.000Z',
          },
          resolvedLocation: { label: 'Manual', latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh', resolver: 'manual' },
          lunarDate: null,
          ganZhi: { yearPillar: null, monthPillar: null, dayPillar: null, hourPillar: null },
          trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'medium' },
          normalizationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        },
        chartSystem: 'liu-yao',
        palaces: [],
        pillars: [],
        summary: {
          method: 'Theo thời gian',
          baseHexagram: 'Khôn trên Chấn',
          changedHexagram: 'Cấn trên Chấn',
          movingLines: 'Hào 4',
          shiLine: 'Hào Thế',
          yingLine: 'Hào Ứng',
        },
        liuyao: {
          method: 'time-based',
          movingLinePositions: [4],
          baseHexagram: {
            key: 'kun_over_zhen',
            topTrigramKey: 'kunTrigram',
            bottomTrigramKey: 'zhenTrigram',
            name: 'Khôn trên Chấn',
            symbol: 'Phục',
            lines: [
              { position: 1, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'ziEarthly', fiveElementKey: 'water', naYin: 'Hải Trung Kim', sixSpiritKey: 'azureDragon', hiddenSpirit: null },
              { position: 2, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'sibling', earthlyBranchKey: 'chouEarthly', fiveElementKey: 'earth', naYin: 'Bích Thượng Thổ', sixSpiritKey: 'vermilionBird', hiddenSpirit: null },
              { position: 3, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'childDescendant', earthlyBranchKey: 'yinEarthly', fiveElementKey: 'fire', naYin: 'Lô Trung Hỏa', sixSpiritKey: 'hookSnake', hiddenSpirit: null },
              { position: 4, value: 'yin', stateKey: 'oldYin', isMoving: true, roleKey: 'shi', sixKinKey: 'wifeWealth', earthlyBranchKey: 'maoEarthly', fiveElementKey: 'wood', naYin: 'Đại Lâm Mộc', sixSpiritKey: 'soaringSerpent', hiddenSpirit: 'Phục Đăng Hỏa' },
              { position: 5, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'chenEarthly', fiveElementKey: 'earth', naYin: 'Sa Trung Thổ', sixSpiritKey: 'whiteTiger', hiddenSpirit: null },
              { position: 6, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'ying', sixKinKey: 'parent', earthlyBranchKey: 'siEarthly', fiveElementKey: 'fire', naYin: 'Lô Trung Hỏa', sixSpiritKey: 'blackTortoise', hiddenSpirit: null },
            ],
          },
          changedHexagram: {
            key: 'gen_over_kun',
            topTrigramKey: 'genTrigram',
            bottomTrigramKey: 'kunTrigram',
            name: 'Cấn trên Khôn',
            symbol: 'Bác',
            lines: [
              { position: 1, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'ziEarthly', fiveElementKey: 'water', naYin: 'Hải Trung Kim', sixSpiritKey: 'azureDragon', hiddenSpirit: null },
              { position: 2, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'sibling', earthlyBranchKey: 'chouEarthly', fiveElementKey: 'earth', naYin: 'Bích Thượng Thổ', sixSpiritKey: 'vermilionBird', hiddenSpirit: null },
              { position: 3, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'childDescendant', earthlyBranchKey: 'yinEarthly', fiveElementKey: 'fire', naYin: 'Lô Trung Hỏa', sixSpiritKey: 'hookSnake', hiddenSpirit: null },
              { position: 4, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'shi', sixKinKey: 'wifeWealth', earthlyBranchKey: 'maoEarthly', fiveElementKey: 'wood', naYin: 'Đại Lâm Mộc', sixSpiritKey: 'soaringSerpent', hiddenSpirit: null },
              { position: 5, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'chenEarthly', fiveElementKey: 'earth', naYin: 'Sa Trung Thổ', sixSpiritKey: 'whiteTiger', hiddenSpirit: null },
              { position: 6, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'ying', sixKinKey: 'parent', earthlyBranchKey: 'siEarthly', fiveElementKey: 'fire', naYin: 'Lô Trung Hỏa', sixSpiritKey: 'blackTortoise', hiddenSpirit: null },
            ],
          },
          nuclearHexagram: undefined,
          oppositeHexagram: undefined,
          inverseHexagram: undefined,
        },
        engineVersion: {
          enginePackage: '@ziweiai/astro-engine',
          engineSemver: '0.1.0',
          adapterVersions: [],
          fixtureSetVersion: 'phase-3-fixtures-v1',
          schemaVersion: 'phase-3-contracts-v1',
        },
        ruleSource: {
          system: 'liu-yao',
          canonicalLibrary: { name: 'xuanshu', version: 'ref' },
          ruleSet: 'phase-3-default',
          schoolNotes: null,
          sourcePriority: 'xuanshu-first',
        },
        inputHash: { algorithm: 'sha256', digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' },
        calculationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        provenance: {
          referenceRepos: ['.ref/xuanshu'],
          runtimeLibraries: [],
          adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
          fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
          calculationTimestamp: '2026-06-12T00:00:00.000Z',
          warnings: [],
        },
        createdAt: '2026-06-12T00:00:00.000Z',
      },
      explanationKind: 'overview',
      explanationContext: {
        chartSystem: 'liu-yao',
        visibleMessageKeys: ['birth.time.verified'],
        confidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        sourceLabel: 'xuanshu@ref',
      },
    });

    expect(prompt).toContain('Lục Hào');
    expect(prompt).toContain('Quẻ gốc: Khôn trên Chấn');
    expect(prompt).toContain('Quẻ biến: Cấn trên Khôn');
    expect(prompt).toContain('Hào động: 4');
    expect(prompt).toContain('Thế');
    expect(prompt).toContain('Ứng');
    expect(prompt).toContain('Thê tài');
    expect(prompt).toContain('Đằng Xà');
    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
  });
});

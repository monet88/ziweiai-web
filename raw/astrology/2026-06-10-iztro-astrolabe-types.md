---
Source: https://github.com/SylarLong/iztro
Collected: 2026-06-10
Published: 2023-10-25
---

# Iztro Astrolabe and Palace Type Definitions

Here are the raw type definitions from the `iztro` library representing the Zi Wei Dou Shu astrolabe and palace structures.

## Astrolabe Type Definition

```typescript
export type Astrolabe = {
  /** Gender */
  gender: string;
  /** Solar Date (YYYY-MM-DD) */
  solarDate: string;
  /** Lunar Date */
  lunarDate: string;
  /** Heavenly Stem and Earthly Branch Date (干支纪年) */
  chineseDate: string;
  /** Raw dates for internal usage */
  rawDates: {
    lunarDate: LunarDate;
    chineseDate: HeavenlyStemAndEarthlyBranchDate;
  };
  /** Time (birth hour branch) */
  time: string;
  /** Time range */
  timeRange: string;
  /** Western Sign */
  sign: string;
  /** Chinese Zodiac */
  zodiac: string;
  /** Earthly branch of the Soul Palace (命宫地支) */
  earthlyBranchOfSoulPalace: EarthlyBranchName;
  /** Earthly branch of the Body Palace (身宫地支) */
  earthlyBranchOfBodyPalace: EarthlyBranchName;
  /** Soul Star (命主) */
  soul: StarName;
  /** Body Star (身主) */
  body: StarName;
  /** Five Elements Class (五行局) */
  fiveElementsClass: FiveElementsClassName;
  /** 12 Palaces data */
  palaces: IFunctionalPalace[];
  /** Copyright info */
  copyright: string;
};
```

## Palace Type Definition

```typescript
export type Palace = {
  /** Palace index (0-11) starting from Yin (寅) */
  index: number;
  /** Palace name (e.g. 命宫, 夫妻宫) */
  name: PalaceName;
  /** Is this the Body Palace (身宫) */
  isBodyPalace: boolean;
  /** Is this the Original Palace (来因宫) */
  isOriginalPalace: boolean;
  /** Heavenly stem of the palace */
  heavenlyStem: HeavenlyStemName;
  /** Earthly branch of the palace */
  earthlyBranch: EarthlyBranchName;
  /** Major stars in this palace */
  majorStars: FunctionalStar[];
  /** Minor stars in this palace */
  minorStars: FunctionalStar[];
  /** Adjective / small stars in this palace */
  adjectiveStars: FunctionalStar[];
  /** 12 Chang Sheng stars */
  changsheng12: StarName;
  /** 12 Bo Shi stars */
  boshi12: StarName;
  /** 12 Jiang Qian stars */
  jiangqian12: StarName;
  /** 12 Sui Qian stars */
  suiqian12: StarName;
  /** Decadal range and stem/branch for this palace */
  decadal: Decadal;
  /** Ages assigned to this palace for small fortune */
  ages: number[];
};
```

## Horoscope (运限) Type Definition

```typescript
export type HoroscopeItem = {
  index: number;
  name: string;
  heavenlyStem: HeavenlyStemName;
  earthlyBranch: EarthlyBranchName;
  palaceNames: PalaceName[];
  mutagen: StarName[];
  stars?: FunctionalStar[][];
};

export type Horoscope = {
  lunarDate: string;
  solarDate: string;
  decadal: HoroscopeItem;
  age: HoroscopeItem & {
    nominalAge: number;
  };
  yearly: HoroscopeItem & { yearlyDecStar: { jiangqian12: StarName[]; suiqian12: StarName[] } };
  monthly: HoroscopeItem;
  daily: HoroscopeItem;
  hourly: HoroscopeItem;
};
```

import type { BirthInput, ChartSnapshot, ChartSystem } from '@ziweiai/contracts';

export interface ChartCalculationOptions {
  viewYear?: number;
}

export interface AstrologyChartAdapter {
  readonly system: ChartSystem;
  readonly adapterName: string;
  readonly adapterVersion: string;
  // Lá số có phụ thuộc viewYear hay không (lưu niên). Hệ không phụ thuộc (vd Bát Tự)
  // không được đưa viewYear vào khóa chống trùng, tránh tạo bản ghi trùng theo từng năm.
  readonly usesViewYear: boolean;
  calculateChart(input: BirthInput, options?: ChartCalculationOptions): Promise<ChartSnapshot>;
}

export interface AstrologyAdapterRegistryEntry {
  readonly system: ChartSystem;
  readonly canonicalLibrary: string;
  readonly configProfile: string;
}

export const phase3AdapterRegistry: readonly AstrologyAdapterRegistryEntry[] = [
  {
    system: 'zi-wei-dou-shu',
    canonicalLibrary: 'iztro@2.5.8',
    configProfile: 'phase-3-default',
  },
  {
    system: 'ba-zi',
    canonicalLibrary: 'lunar-javascript@1.7.7',
    configProfile: 'phase-3-default',
  },
  {
    system: 'mei-hua-yi-shu',
    canonicalLibrary: 'lunar-javascript@1.7.7 + time-port',
    configProfile: 'phase-3-default',
  },
  {
    system: 'liu-yao',
    canonicalLibrary: 'xuanshu@liuyao-reference',
    configProfile: 'phase-5-default',
  },
  {
    system: 'da-liu-ren',
    canonicalLibrary: 'xuanshu@daliuren-reference',
    configProfile: 'phase-6-default',
  },
  {
    system: 'qi-men-dun-jia',
    canonicalLibrary: 'xuanshu@qimen-reference',
    configProfile: 'phase-7-default',
  },
];

// Job harvest + dich tu vung Hoang lich (#48 / US-040): thu thap TOAN BO chuoi Han
// huu han ma tyme4ts co the sinh ra (nghi/ky/than sat/12 truc/28 sao/cuu tinh/bành
// to bach ky/can chi/con giap/dia chi/huong sat), dich MOT LAN sang Viet qua pipeline
// B6-0 roi ghi ra bang tra Han -> Viet (almanac-vocab.vi.json). Bang nay duoc gen
// thanh TS module va dung lam overlay: math cua tyme4ts giu nguyen, chi anh xa output
// sang Viet truoc khi roi module (Han-gate fail-fast neu lot chuoi chua dich).
//
// Khac cac job khac (doc dataset .ref tinh), job nay "nguon" la chinh tyme4ts: chay
// thu vien tren mot dai ngay rong de gom het tu vung. Cac tap nghi/ky/than sat la huu
// han theo truyen thong; can chi/bành to/con giap/dia chi co dung 60/12 phan tu. Dai
// ngay rong (2000-2040) du bao phu toan bo.

import { SolarDay } from 'tyme4ts';
import type { TranslationUnit } from '../core';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

// Bang tra cuoi cung: Han -> Viet. Job ghi dang object {han: vi} de gen TS module.
export type AlmanacVocabVi = Record<string, string>;

// Thu thap moi chuoi Han doc nhat tyme4ts sinh ra tren dai ngay [startYear, endYear].
// Tra ve mang da dedupe + sort on dinh (de diff vi.json on dinh giua cac lan chay).
export function harvestAlmanacVocab(startYear: number, endYear: number): string[] {
  const seen = new Set<string>();
  const add = (value: string | null | undefined): void => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        seen.add(trimmed);
      }
    }
  };

  for (let year = startYear; year <= endYear; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day += 1) {
        const lunarDay = SolarDay.fromYmd(year, month, day).getLunarDay();
        lunarDay.getRecommends().forEach((item) => add(item.getName()));
        lunarDay.getAvoids().forEach((item) => add(item.getName()));
        lunarDay.getGods().forEach((item) => add(item.getName()));
        add(lunarDay.getDuty().getName());
        add(lunarDay.getTwelveStar().getName());
        add(lunarDay.getTwentyEightStar().getName());
        add(lunarDay.getNineStar().toString()); // ten cuu tinh day du, vd "一白水"
        const dayCycle = lunarDay.getSixtyCycle();
        add(dayCycle.getName()); // can chi ngay
        add(lunarDay.getYearSixtyCycle().getName());
        add(lunarDay.getMonthSixtyCycle().getName());
        add(dayCycle.getPengZu().getName()); // bành to bach ky (cau dai)
        const branch = dayCycle.getEarthBranch();
        add(branch.getName());
        add(branch.getZodiac().getName());
        add(branch.getOpposite().getName()); // dia chi xung
        add(branch.getOpposite().getZodiac().getName()); // con giap xung
        add(branch.getOminous().getName()); // huong sat (Dong/Tay/Nam/Bac)
      }
    }
  }

  return [...seen].sort((a, b) => a.localeCompare(b, 'zh'));
}

function unitId(seq: number): string {
  return `almanac.t${seq}`;
}

export type AlmanacFlattenResult = {
  readonly units: TranslationUnit[];
  readonly rebuild: (translated: ReadonlyMap<string, string>) => AlmanacVocabVi;
};

// Flatten: moi chuoi Han doc nhat -> mot unit (id on dinh theo thu tu sort). rebuild
// dung lai bang {han: vi} theo dung cap.
export function flattenAlmanacVocab(vocab: readonly string[]): AlmanacFlattenResult {
  const plan = vocab.map((han, index) => ({ id: unitId(index), han }));
  const units: TranslationUnit[] = plan.map(({ id, han }) => ({ id, text: han }));

  const rebuild = (translated: ReadonlyMap<string, string>): AlmanacVocabVi => {
    const table: AlmanacVocabVi = {};
    for (const { id, han } of plan) {
      const vi = translated.get(id);
      if (vi === undefined) {
        throw new Error(`Thiếu bản dịch cho unit "${id}" (Hán "${han}").`);
      }
      table[han] = vi;
    }
    return table;
  };

  return { units, rebuild };
}

// --- Runner (chi chay khi goi truc tiep qua tsx) -----------------------------
//
//   npx tsx --env-file=.env scripts/translate/jobs/almanac-vocab.ts [--batch 40]

const OUT_DIR_REL = '../data';
const OUT_REL = '../data/almanac-vocab.vi.json';
const CACHE_REL = '../data/almanac-vocab.cache.json';
const HARVEST_START_YEAR = 2000;
const HARVEST_END_YEAR = 2040;

async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const batchArgIndex = process.argv.indexOf('--batch');
  const batchSize =
    batchArgIndex !== -1 ? Number.parseInt(process.argv[batchArgIndex + 1] ?? '', 10) : 40;

  const { translateUnits } = await import('../core');
  const { createOpenAiCompatibleTranslator, loadConfigFromEnv } = await import('../translate-client');

  const vocab = harvestAlmanacVocab(HARVEST_START_YEAR, HARVEST_END_YEAR);
  const { units, rebuild } = flattenAlmanacVocab(vocab);

  const cachePath = resolve(here, CACHE_REL);
  const cache = new Map<string, string>();
  if (existsSync(cachePath)) {
    const parsed = JSON.parse(readFileSync(cachePath, 'utf8')) as Record<string, string>;
    for (const [id, vi] of Object.entries(parsed)) {
      if (typeof vi === 'string') cache.set(id, vi);
    }
  }

  const config = loadConfigFromEnv();
  const translator = createOpenAiCompatibleTranslator(config);
  console.log(
    `[almanac-vocab] harvest ${HARVEST_START_YEAR}-${HARVEST_END_YEAR} -> ${units.length} chuoi Han doc nhat, ` +
      `model ${config.model}, batch ${batchSize}.`,
  );

  const report = await translateUnits(units, translator, { batchSize, cache });
  const table = rebuild(report.translated);

  const outDir = resolve(here, OUT_DIR_REL);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(cachePath, `${JSON.stringify(Object.fromEntries(report.translated), null, 2)}\n`, 'utf8');
  writeFileSync(resolve(here, OUT_REL), `${JSON.stringify(table, null, 2)}\n`, 'utf8');

  console.log(
    `[almanac-vocab] xong: ${units.length} unit (cache ${report.fromCache}, llm ${report.fromLlm}, ` +
      `retry ${report.retried}) -> bang ${Object.keys(table).length} muc. Ghi ${OUT_REL}.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error: unknown) => {
    console.error(`[almanac-vocab] that bai: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}

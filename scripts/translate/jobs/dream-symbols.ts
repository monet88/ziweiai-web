// Job port dữ liệu hệ Giải mộng (#42 / US-034): flatten dataset dreamSymbols (Hán)
// thành unit để dịch qua pipeline chung, rồi re-assemble về dataset tiếng Việt.
//
// Phần thuần (flatten + rebuild) tách khỏi phần chạy LLM + I/O để test không cần
// network. main() ở cuối chỉ chạy khi gọi trực tiếp qua tsx.
//
// Nguồn: .ref/FateAtelier/src/data/dreamSymbols.ts (repo nội bộ của team). Mỗi entry
// có keywords[] + meaning + positive?/negative?/advice? + category — TẤT CẢ Hán, kể cả
// keyword (người Việt sẽ gõ "rắn", "rồng" để tra nên keyword cũng phải là tiếng Việt).

import type { TranslationUnit } from '../core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

export type DreamSymbolSource = {
  readonly keywords: string[];
  readonly meaning: string;
  readonly positive?: string;
  readonly negative?: string;
  readonly advice?: string;
  readonly category: string;
};

// Dataset Việt sau dịch: cùng hình dạng nguồn, mọi chuỗi đã sang tiếng Việt.
export type DreamSymbolVi = {
  readonly keywords: string[];
  readonly meaning: string;
  readonly positive?: string;
  readonly negative?: string;
  readonly advice?: string;
  readonly category: string;
};

// Các field chuỗi đơn (không phải mảng) cần dịch trên mỗi entry.
const SCALAR_FIELDS = ['meaning', 'positive', 'negative', 'advice', 'category'] as const;

// Khóa ổn định cho một chuỗi nguồn: dedupe theo nội dung để không dịch lặp (category
// "动物" lặp nhiều lần) -> tiết kiệm token + ép nhất quán. Dùng index nội dung thay vì
// vị trí entry nên cùng một chuỗi luôn map về một bản dịch.
function unitId(seq: number): string {
  return `dream.t${seq}`;
}

export type FlattenResult = {
  readonly units: TranslationUnit[];
  // Re-assemble dataset Việt từ map id->vi mà pipeline trả về.
  readonly rebuild: (translated: ReadonlyMap<string, string>) => DreamSymbolVi[];
};

// Flatten + dedupe. Trả về units (mỗi chuỗi nguồn duy nhất một unit) và hàm rebuild
// dựng lại dataset theo đúng thứ tự + cấu trúc gốc.
export function flattenDreamSymbols(symbols: readonly DreamSymbolSource[]): FlattenResult {
  const textToId = new Map<string, string>();
  const units: TranslationUnit[] = [];

  const intern = (text: string): string => {
    const existing = textToId.get(text);
    if (existing !== undefined) {
      return existing;
    }
    const id = unitId(units.length);
    textToId.set(text, id);
    units.push({ id, text });
    return id;
  };

  // Ghi nhận id cho mọi chuỗi trong dataset theo thứ tự gặp.
  const plan = symbols.map((symbol) => {
    const keywordIds = symbol.keywords.map((kw) => intern(kw));
    const scalarIds: Partial<Record<(typeof SCALAR_FIELDS)[number], string>> = {};
    for (const field of SCALAR_FIELDS) {
      const value = symbol[field];
      if (typeof value === 'string' && value.length > 0) {
        scalarIds[field] = intern(value);
      }
    }
    return { keywordIds, scalarIds };
  });

  const rebuild = (translated: ReadonlyMap<string, string>): DreamSymbolVi[] => {
    const take = (id: string): string => {
      const vi = translated.get(id);
      if (vi === undefined) {
        throw new Error(`Thiếu bản dịch cho unit "${id}".`);
      }
      return vi;
    };
    return plan.map((entry, index) => {
      const source = symbols[index];
      const result: DreamSymbolVi = {
        keywords: entry.keywordIds.map(take),
        meaning: take(entry.scalarIds.meaning as string),
        category: take(entry.scalarIds.category as string),
        ...(entry.scalarIds.positive ? { positive: take(entry.scalarIds.positive) } : {}),
        ...(entry.scalarIds.negative ? { negative: take(entry.scalarIds.negative) } : {}),
        ...(entry.scalarIds.advice ? { advice: take(entry.scalarIds.advice) } : {}),
      };
      void source;
      return result;
    });
  };

  return { units, rebuild };
}

// --- Runner (chỉ chạy khi gọi trực tiếp qua tsx) -----------------------------
//
//   npx tsx --env-file=.env scripts/translate/jobs/dream-symbols.ts [--batch 30]
//
// Import data nguồn từ .ref (repo nội bộ team), flatten + dedupe -> dịch qua
// pipeline chung -> re-assemble -> validate sạch Hán -> ghi dataset Việt staging
// + cache resume. Dataset Việt staging nằm trong tooling dir; bước đưa vào module
// thật của hệ Giải mộng để dành cho #42 (chưa dựng cấu trúc module khi chưa kickoff).

const SOURCE_REL = '../../../.ref/FateAtelier/src/data/dreamSymbols.ts';
const OUT_DIR_REL = '../data';
const OUT_REL = '../data/dream-symbols.vi.json';
const CACHE_REL = '../data/dream-symbols.cache.json';

async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const batchArgIndex = process.argv.indexOf('--batch');
  const batchSize =
    batchArgIndex !== -1 ? Number.parseInt(process.argv[batchArgIndex + 1] ?? '', 10) : 30;

  // Lazy import: core/client kéo theo fetch nhưng không chạy network cho tới khi dịch.
  const { translateUnits } = await import('../core');
  const { createOpenAiCompatibleTranslator, loadConfigFromEnv } = await import('../translate-client');

  const sourceModule = (await import(pathToFileURL(resolve(here, SOURCE_REL)).href)) as {
    dreamSymbols: DreamSymbolSource[];
  };
  const symbols = sourceModule.dreamSymbols;
  const { units, rebuild } = flattenDreamSymbols(symbols);

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
    `[dream] ${symbols.length} entry -> ${units.length} unit (deduped), model ${config.model}, batch ${batchSize}.`,
  );

  const report = await translateUnits(units, translator, { batchSize, cache });
  const viSymbols = rebuild(report.translated);

  const outDir = resolve(here, OUT_DIR_REL);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(cachePath, `${JSON.stringify(Object.fromEntries(report.translated), null, 2)}\n`, 'utf8');
  writeFileSync(resolve(here, OUT_REL), `${JSON.stringify(viSymbols, null, 2)}\n`, 'utf8');

  console.log(
    `[dream] xong: ${units.length} unit (cache ${report.fromCache}, llm ${report.fromLlm}, ` +
      `retry ${report.retried}) -> ${viSymbols.length} entry Việt. Ghi ${OUT_REL}.`,
  );
}

// Chạy main() chỉ khi file được gọi trực tiếp (không phải khi import từ test).
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error: unknown) => {
    console.error(`[dream] thất bại: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}

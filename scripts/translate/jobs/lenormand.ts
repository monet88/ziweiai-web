// Job port dữ liệu hệ Lenormand (#45 / US-035): 36 lá + bộ trải bài (Hán -> Việt).
//
// Phần thuần (flatten + rebuild) tách khỏi LLM + I/O để test không cần network.
//
// Nguồn: .ref/mingyu/src/lib/divination/algorithms/lenormand.ts (repo nội bộ team).
// LENORMAND_CARDS + SPREADS KHÔNG được export ở nguồn, nên runner nạp qua shim:
// đọc text nguồn, append một dòng export, ghi file tạm rồi import động. Không gõ
// lại data tay, không sửa file trong .ref.

import type { TranslationUnit } from '../core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';

export type LenormandCardSource = {
  readonly id: number;
  readonly name: string;
  readonly keywords: string[];
  readonly meaning: string;
};

export type LenormandSpreadSource = {
  readonly name: string;
  readonly positions: string[];
};

export type LenormandCardVi = LenormandCardSource;
export type LenormandSpreadVi = { readonly key: string; readonly name: string; readonly positions: string[] };

export type LenormandViDataset = {
  readonly cards: LenormandCardVi[];
  readonly spreads: LenormandSpreadVi[];
};

function unitId(seq: number): string {
  return `lenormand.t${seq}`;
}

export type LenormandFlattenResult = {
  readonly units: TranslationUnit[];
  readonly rebuild: (translated: ReadonlyMap<string, string>) => LenormandViDataset;
};

// Flatten + dedupe: id ổn định theo nội dung (id số của lá giữ nguyên, chỉ chuỗi
// hiển thị mới dịch). rebuild dựng lại đúng thứ tự lá + thứ tự bộ trải.
export function flattenLenormand(
  cards: readonly LenormandCardSource[],
  spreads: ReadonlyMap<string, LenormandSpreadSource>,
): LenormandFlattenResult {
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

  const cardPlan = cards.map((card) => ({
    id: card.id,
    nameId: intern(card.name),
    keywordIds: card.keywords.map((kw) => intern(kw)),
    meaningId: intern(card.meaning),
  }));

  const spreadPlan = [...spreads.entries()].map(([key, spread]) => ({
    key,
    nameId: intern(spread.name),
    positionIds: spread.positions.map((pos) => intern(pos)),
  }));

  const rebuild = (translated: ReadonlyMap<string, string>): LenormandViDataset => {
    const take = (id: string): string => {
      const vi = translated.get(id);
      if (vi === undefined) {
        throw new Error(`Thiếu bản dịch cho unit "${id}".`);
      }
      return vi;
    };
    return {
      cards: cardPlan.map((card) => ({
        id: card.id,
        name: take(card.nameId),
        keywords: card.keywordIds.map(take),
        meaning: take(card.meaningId),
      })),
      spreads: spreadPlan.map((spread) => ({
        key: spread.key,
        name: take(spread.nameId),
        positions: spread.positionIds.map(take),
      })),
    };
  };

  return { units, rebuild };
}

// --- Runner (chỉ chạy khi gọi trực tiếp qua tsx) -----------------------------
//
//   npx tsx --env-file=.env scripts/translate/jobs/lenormand.ts [--batch 30]

const SOURCE_REL = '../../../.ref/mingyu/src/lib/divination/algorithms/lenormand.ts';
const OUT_DIR_REL = '../data';
const OUT_REL = '../data/lenormand.vi.json';
const CACHE_REL = '../data/lenormand.cache.json';

// Nạp LENORMAND_CARDS + SPREADS từ nguồn không-export qua shim: append export rồi
// import động. tsx/esbuild erase `import type` nên file tạm không cần resolve được
// import gốc lúc chạy. Xoá file tạm sau khi nạp.
async function loadSource(here: string): Promise<{
  cards: LenormandCardSource[];
  spreads: Map<string, LenormandSpreadSource>;
}> {
  const sourcePath = resolve(here, SOURCE_REL);
  const text = readFileSync(sourcePath, 'utf8');
  const shimPath = resolve(here, OUT_DIR_REL, '.lenormand-shim.ts');
  if (!existsSync(resolve(here, OUT_DIR_REL))) {
    mkdirSync(resolve(here, OUT_DIR_REL), { recursive: true });
  }
  writeFileSync(shimPath, `${text}\nexport { LENORMAND_CARDS, SPREADS };\n`, 'utf8');
  try {
    const mod = (await import(pathToFileURL(shimPath).href)) as {
      LENORMAND_CARDS: LenormandCardSource[];
      SPREADS: Record<string, LenormandSpreadSource>;
    };
    return { cards: mod.LENORMAND_CARDS, spreads: new Map(Object.entries(mod.SPREADS)) };
  } finally {
    rmSync(shimPath, { force: true });
  }
}

async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const batchArgIndex = process.argv.indexOf('--batch');
  const batchSize =
    batchArgIndex !== -1 ? Number.parseInt(process.argv[batchArgIndex + 1] ?? '', 10) : 30;

  const { translateUnits } = await import('../core');
  const { createOpenAiCompatibleTranslator, loadConfigFromEnv } = await import('../translate-client');

  const { cards, spreads } = await loadSource(here);
  const { units, rebuild } = flattenLenormand(cards, spreads);

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
    `[lenormand] ${cards.length} lá + ${spreads.size} bộ trải -> ${units.length} unit (deduped), ` +
      `model ${config.model}, batch ${batchSize}.`,
  );

  const report = await translateUnits(units, translator, { batchSize, cache });
  const dataset = rebuild(report.translated);

  const outDir = resolve(here, OUT_DIR_REL);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(cachePath, `${JSON.stringify(Object.fromEntries(report.translated), null, 2)}\n`, 'utf8');
  writeFileSync(resolve(here, OUT_REL), `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

  console.log(
    `[lenormand] xong: ${units.length} unit (cache ${report.fromCache}, llm ${report.fromLlm}, ` +
      `retry ${report.retried}) -> ${dataset.cards.length} lá + ${dataset.spreads.length} bộ. Ghi ${OUT_REL}.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error: unknown) => {
    console.error(`[lenormand] thất bại: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}

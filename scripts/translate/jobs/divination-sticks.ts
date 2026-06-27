// Job port dữ liệu hệ Xin xăm (#47 / US-036): 100 quẻ xăm (Hán -> Việt). Hệ lớn
// nhất nhóm B6 — mỗi quẻ có cấu trúc lồng sâu: level (xếp hạng) + title + poem +
// interpretation + advice + story?/dailyPoem? + detailedInterpretations (17 mục) +
// ageGenderInterpretations (5 mục) + categories. Tất cả Hán.
//
// Phần thuần (flatten + rebuild) tách khỏi LLM + I/O để test không cần network.
// Flatten đệ quy mọi chuỗi (string leaf) trong từng quẻ, dedupe theo nội dung;
// rebuild dựng lại đúng cây gốc. `id` số giữ nguyên, chỉ chuỗi hiển thị mới dịch.
//
// Nguồn: .ref/FateAtelier/src/data/divinationSticks.ts (repo nội bộ team), export
// sẵn `divinationSticks` nên import động trực tiếp (không cần shim).

import type { TranslationUnit } from '../core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

// Quẻ xăm nguồn: cây JSON với leaf là chuỗi (hoặc number ở `id`). Dùng kiểu lỏng
// để flatten đệ quy không phải liệt kê hết 17+5 mục con; rebuild giữ nguyên hình dạng.
export type StickSource = Record<string, unknown>;

function unitId(seq: number): string {
  return `stick.t${seq}`;
}

export type SticksFlattenResult = {
  readonly units: TranslationUnit[];
  readonly rebuild: (translated: ReadonlyMap<string, string>) => StickSource[];
};

// Cây kế hoạch: mỗi node giữ dạng để rebuild. String -> {id}; number/bool -> giá
// trị nguyên; object/array -> đệ quy. `id` (number) không bị dịch vì là number leaf.
type PlanNode =
  | { kind: 'translate'; id: string }
  | { kind: 'literal'; value: unknown }
  | { kind: 'array'; items: PlanNode[] }
  | { kind: 'object'; entries: [string, PlanNode][] };

// Flatten + dedupe đệ quy. Cùng một chuỗi nguồn (vd "上上" lặp ở nhiều quẻ) chỉ tạo
// một unit -> tiết kiệm token + ép dịch nhất quán xếp hạng/nhãn.
export function flattenSticks(sticks: readonly StickSource[]): SticksFlattenResult {
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

  const planValue = (value: unknown): PlanNode => {
    if (typeof value === 'string') {
      // Chuỗi rỗng giữ literal (không gửi LLM dịch chuỗi rỗng).
      return value.length > 0 ? { kind: 'translate', id: intern(value) } : { kind: 'literal', value };
    }
    if (Array.isArray(value)) {
      return { kind: 'array', items: value.map(planValue) };
    }
    if (typeof value === 'object' && value !== null) {
      return { kind: 'object', entries: Object.entries(value).map(([k, v]) => [k, planValue(v)]) };
    }
    return { kind: 'literal', value };
  };

  const plan = sticks.map(planValue);

  const rebuild = (translated: ReadonlyMap<string, string>): StickSource[] => {
    const take = (id: string): string => {
      const vi = translated.get(id);
      if (vi === undefined) {
        throw new Error(`Thiếu bản dịch cho unit "${id}".`);
      }
      return vi;
    };
    const build = (node: PlanNode): unknown => {
      switch (node.kind) {
        case 'translate':
          return take(node.id);
        case 'literal':
          return node.value;
        case 'array':
          return node.items.map(build);
        case 'object': {
          const obj: Record<string, unknown> = {};
          for (const [key, child] of node.entries) {
            obj[key] = build(child);
          }
          return obj;
        }
      }
    };
    return plan.map((node) => build(node) as StickSource);
  };

  return { units, rebuild };
}

// --- Runner (chỉ chạy khi gọi trực tiếp qua tsx) -----------------------------
//
//   npx tsx --env-file=.env scripts/translate/jobs/divination-sticks.ts [--batch 30]
//
// Dataset lớn (100 quẻ -> hàng nghìn unit) nên cache resume quan trọng: chạy lại
// sau khi gián đoạn sẽ bỏ qua phần đã dịch sạch.

const SOURCE_REL = '../../../.ref/FateAtelier/src/data/divinationSticks.ts';
const OUT_DIR_REL = '../data';
const OUT_REL = '../data/divination-sticks.vi.json';
const CACHE_REL = '../data/divination-sticks.cache.json';

async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const batchArgIndex = process.argv.indexOf('--batch');
  const batchSize =
    batchArgIndex !== -1 ? Number.parseInt(process.argv[batchArgIndex + 1] ?? '', 10) : 30;

  const { translateUnits } = await import('../core');
  const { createOpenAiCompatibleTranslator, loadConfigFromEnv } = await import('../translate-client');

  const sourceModule = (await import(pathToFileURL(resolve(here, SOURCE_REL)).href)) as {
    divinationSticks: StickSource[];
  };
  const sticks = sourceModule.divinationSticks;
  const { units, rebuild } = flattenSticks(sticks);

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
    `[sticks] ${sticks.length} quẻ -> ${units.length} unit (deduped), model ${config.model}, batch ${batchSize}.`,
  );

  const report = await translateUnits(units, translator, { batchSize, cache });
  const dataset = rebuild(report.translated);

  const outDir = resolve(here, OUT_DIR_REL);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(cachePath, `${JSON.stringify(Object.fromEntries(report.translated), null, 2)}\n`, 'utf8');
  writeFileSync(resolve(here, OUT_REL), `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

  console.log(
    `[sticks] xong: ${units.length} unit (cache ${report.fromCache}, llm ${report.fromLlm}, ` +
      `retry ${report.retried}) -> ${dataset.length} quẻ Việt. Ghi ${OUT_REL}.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error: unknown) => {
    console.error(`[sticks] thất bại: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}

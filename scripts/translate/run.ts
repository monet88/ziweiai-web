#!/usr/bin/env -S npx tsx
// CLI runner cho pipeline dịch Hán -> Việt (backlog #41 / US-033).
//
// Vai trò: đọc một file "job" (mảng TranslationUnit JSON đã được hệ B6 flatten ra),
// dịch qua LLM OpenAI-compatible, ghi cache resume + file kết quả {id: vi}. Mỗi hệ
// B6 (giải mộng, xin xăm...) tự viết bước flatten dataset -> units và re-assemble
// units -> dataset Việt; runner này chỉ lo phần chung: gọi LLM + cache + validate.
//
// Cách dùng:
//   npx tsx scripts/translate/run.ts --in <units.json> --out <vi.json> [--cache <cache.json>] [--batch 40]
//
// units.json:  [{ "id": "dream.snake.meaning", "text": "蛇在梦中..." }, ...]
// vi.json:     { "dream.snake.meaning": "Rắn trong mơ...", ... }
// cache.json:  cùng dạng vi.json; được đọc trước khi chạy và ghi đè sau mỗi lần chạy
//              để lần sau resume (bỏ qua unit đã dịch sạch Hán).
//
// Không in giá trị API key. Đọc cấu hình LLM từ .env qua loadConfigFromEnv.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { translateUnits, type TranslationUnit } from './core';
import { createOpenAiCompatibleTranslator, loadConfigFromEnv } from './translate-client';

type CliArgs = {
  in: string;
  out: string;
  cache?: string;
  batch?: number;
};

function parseArgs(argv: readonly string[]): CliArgs {
  const map = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`Thiếu giá trị cho --${key}.`);
      }
      map.set(key, value);
      i += 1;
    }
  }
  const input = map.get('in');
  const output = map.get('out');
  if (!input || !output) {
    throw new Error('Bắt buộc có --in <units.json> và --out <vi.json>.');
  }
  const batchRaw = map.get('batch');
  return {
    in: input,
    out: output,
    cache: map.get('cache'),
    batch: batchRaw === undefined ? undefined : Number.parseInt(batchRaw, 10),
  };
}

function readUnits(path: string): TranslationUnit[] {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`File --in "${path}" phải là mảng {id, text}.`);
  }
  return parsed.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`Phần tử thứ ${index} trong --in không phải object.`);
    }
    const { id, text } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || typeof text !== 'string') {
      throw new Error(`Phần tử thứ ${index} trong --in thiếu id/text dạng chuỗi.`);
    }
    return { id, text };
  });
}

function readCache(path: string | undefined): Map<string, string> {
  if (!path || !existsSync(path)) {
    return new Map<string, string>();
  }
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`File --cache "${path}" phải là object {id: vi}.`);
  }
  const map = new Map<string, string>();
  for (const [id, vi] of Object.entries(parsed)) {
    if (typeof vi === 'string') {
      map.set(id, vi);
    }
  }
  return map;
}

function writeJsonObject(path: string, map: ReadonlyMap<string, string>): void {
  const obj: Record<string, string> = {};
  for (const [id, vi] of map) {
    obj[id] = vi;
  }
  writeFileSync(path, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const units = readUnits(args.in);
  const cache = readCache(args.cache);
  const config = loadConfigFromEnv();
  const translator = createOpenAiCompatibleTranslator(config);

  console.log(`[translate] ${units.length} unit, model ${config.model}, batch ${args.batch ?? 'default'}.`);

  const report = await translateUnits(units, translator, {
    batchSize: args.batch,
    cache,
  });

  // Ghi cache (gộp với bản cũ) trước khi ghi out: lần chạy sau resume được kể cả
  // khi out bị xử lý lỗi sau đó.
  if (args.cache) {
    writeJsonObject(args.cache, report.translated);
  }
  writeJsonObject(args.out, report.translated);

  console.log(
    `[translate] xong: ${report.translated.size} bản dịch ` +
      `(cache ${report.fromCache}, llm ${report.fromLlm}, retry ${report.retried}). Ghi ${args.out}.`,
  );
}

main().catch((error: unknown) => {
  console.error(`[translate] thất bại: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

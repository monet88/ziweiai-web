#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const HANZI_PATTERN = /\p{Script=Han}/u;

// Files allowed to contain Hanzi: legacy dictionary mappers and unit test fixtures.
const ALLOWED_RELATIVE_PATHS = new Set([
  'apps/web/src/lib/features/chart/chart-display.ts',
  'apps/web/src/lib/features/chart/legacy-lunar-date.ts',
  'apps/web/src/lib/text/cjk.ts',
]);

const ROOT = resolve(process.cwd(), 'apps/web/src');

function walk(dir) {
  const results = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (/\.(svelte|ts|js|mjs)$/.test(entry)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk(ROOT);
const violations = [];

for (const file of files) {
  const rel = file.replace(/\\/g, '/').replace(/^.*?(apps\/web\/src\/)/, 'apps/web/src/');
  const isTest = /\.(test|spec)\.(ts|js)$/.test(file);
  const isAllowed = ALLOWED_RELATIVE_PATHS.has(rel) || isTest;

  // Svelte template files must NEVER contain Hanzi, zero exceptions.
  if (file.endsWith('.svelte') || !isAllowed) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (HANZI_PATTERN.test(line)) {
        violations.push({
          file: rel,
          line: i + 1,
          snippet: line.trim().slice(0, 100),
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`\x1b[31m[ERROR] Found ${violations.length} Hanzi character violations in apps/web/src:\x1b[0m`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} -> ${v.snippet}`);
  }
  process.exit(1);
} else {
  console.log(`\x1b[32m✓ Language invariant verified: 0 Hanzi characters found in apps/web/src UI and business logic (${files.length} files checked).\x1b[0m`);
  process.exit(0);
}

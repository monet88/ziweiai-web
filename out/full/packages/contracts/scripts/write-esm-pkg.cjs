// Sinh sentinel dist/esm/package.json để Node/bundler coi dist/esm/*.js là ESM.
// dist/ gốc giữ CJS (api + astro-engine require); dist/esm/ là ESM (web import).
const fs = require('node:fs');
const path = require('node:path');

const esmDir = path.join(__dirname, '..', 'dist', 'esm');
fs.mkdirSync(esmDir, { recursive: true });
fs.writeFileSync(
  path.join(esmDir, 'package.json'),
  JSON.stringify({ type: 'module' }, null, 2) + '\n',
);

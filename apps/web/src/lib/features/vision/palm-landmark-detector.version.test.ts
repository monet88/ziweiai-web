import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MEDIAPIPE_TASKS_VISION_VERSION } from './palm-landmark-detector';

// Bất biến chống lệch version (P2 review): URL wasm CDN trong palm-landmark-detector nhúng cứng
// version "@mediapipe/tasks-vision". Nếu bump dependency mà quên sửa hằng đó, wasm/glue-code tải
// từ CDN có thể không khớp module import động lúc chạy. Test đọc version THỰC từ package.json đã
// cài trong node_modules rồi so với hằng — một lần lệch sẽ fail ngay trong CI thay vì vỡ âm thầm.
//
// Package chặn subpath "./package.json" trong "exports" nên không require thẳng được. Thay vào đó
// resolve entry chính rồi đi ngược lên thư mục gói (chứa package.json) và đọc từ đĩa.
function resolveInstalledVersion(): string {
  const require = createRequire(import.meta.url);
  let dir = dirname(require.resolve('@mediapipe/tasks-vision'));
  for (let depth = 0; depth < 8; depth += 1) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
        name?: string;
        version?: string;
      };
      if (pkg.name === '@mediapipe/tasks-vision' && typeof pkg.version === 'string') {
        return pkg.version;
      }
    } catch {
      // Thư mục này không có package.json hợp lệ — đi tiếp lên cha.
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Không tìm được package.json của @mediapipe/tasks-vision trong node_modules.');
}

describe('MEDIAPIPE_TASKS_VISION_VERSION', () => {
  it('khớp version "@mediapipe/tasks-vision" đã cài trong node_modules', () => {
    expect(MEDIAPIPE_TASKS_VISION_VERSION).toBe(resolveInstalledVersion());
  });
});

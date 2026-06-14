import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const rawInput = await readStdin();
  const settings = JSON.parse(rawInput);
  const moduleUrl = pathToFileURL(path.join(process.cwd(), 'lib/daliuren/index.ts')).href;
  const loadedModule = (await import(moduleUrl)) as {
    createDaLiuRenPaiPan?: (input: unknown) => unknown;
    default?: {
      createDaLiuRenPaiPan?: (input: unknown) => unknown;
    };
  };
  const createDaLiuRenPaiPan = loadedModule.createDaLiuRenPaiPan ?? loadedModule.default?.createDaLiuRenPaiPan;

  if (!createDaLiuRenPaiPan) {
    throw new Error('Không tải được createDaLiuRenPaiPan từ reference xuanshu.');
  }

  const result = createDaLiuRenPaiPan(settings);
  process.stdout.write(JSON.stringify(result));
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Runner xuanshu Đại Lục Nhâm thất bại.';
  process.stderr.write(message);
  process.exitCode = 1;
});

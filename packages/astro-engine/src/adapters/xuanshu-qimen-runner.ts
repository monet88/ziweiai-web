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
  const moduleUrl = pathToFileURL(path.join(process.cwd(), 'lib/qimen/index.ts')).href;
  const loadedModule = (await import(moduleUrl)) as {
    createQiMenPaiPan?: (input: unknown) => unknown;
    default?: {
      createQiMenPaiPan?: (input: unknown) => unknown;
    };
  };
  const createQiMenPaiPan = loadedModule.createQiMenPaiPan ?? loadedModule.default?.createQiMenPaiPan;

  if (!createQiMenPaiPan) {
    throw new Error('Không tải được createQiMenPaiPan từ reference xuanshu.');
  }

  const result = createQiMenPaiPan(settings);
  process.stdout.write(JSON.stringify(result));
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Runner xuanshu Kỳ Môn thất bại.';
  process.stderr.write(message);
  process.exitCode = 1;
});

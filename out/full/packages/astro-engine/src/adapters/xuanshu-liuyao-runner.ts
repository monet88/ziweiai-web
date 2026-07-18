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
  const moduleUrl = pathToFileURL(path.join(process.cwd(), 'lib/liuyao/index.ts')).href;
  const loadedModule = (await import(moduleUrl)) as {
    createLiuYaoPaiPan?: (input: unknown) => unknown;
    default?: {
      createLiuYaoPaiPan?: (input: unknown) => unknown;
    };
  };
  const createLiuYaoPaiPan = loadedModule.createLiuYaoPaiPan ?? loadedModule.default?.createLiuYaoPaiPan;

  if (!createLiuYaoPaiPan) {
    throw new Error('Không tải được createLiuYaoPaiPan từ reference xuanshu.');
  }

  const result = createLiuYaoPaiPan(settings);
  process.stdout.write(JSON.stringify(result));
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Runner xuanshu Lục Hào thất bại.';
  process.stderr.write(message);
  process.exitCode = 1;
});

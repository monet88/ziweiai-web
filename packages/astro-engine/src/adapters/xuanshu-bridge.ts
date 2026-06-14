import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { BirthInput, CalculationConfidence } from '@ziweiai/contracts';

export const XUANSHU_REFERENCE_RUNTIME_REASON = 'XUANSHU_REFERENCE_RUNTIME_UNAVAILABLE' as const;

// Cấu hình input chung cho các runner xuanshu (Đại Lục Nhâm, Kỳ Môn): lấy thời điểm
// và lịch từ BirthInput rồi định dạng theo settings mà module reference yêu cầu.
export type XuanshuBridgeSettings = {
  name: string;
  occupy: string;
  sex: 0 | 1;
  date: string;
  dateType: 0 | 1;
  leapMonthType: 0 | 1;
};

function findWorkspaceRoot(): string {
  let workspaceRoot = process.cwd();

  while (!existsSync(path.join(workspaceRoot, 'pnpm-workspace.yaml'))) {
    const parent = path.dirname(workspaceRoot);
    if (parent === workspaceRoot) {
      throw new Error('Không tìm được workspace root để chạy bridge xuanshu.');
    }
    workspaceRoot = parent;
  }

  return workspaceRoot;
}

function resolveXuanshuBridgePaths(runnerDistRelativePath: string) {
  const workspaceRoot = findWorkspaceRoot();
  const xuanshuRoot = path.join(workspaceRoot, 'vendor', 'xuanshu-runtime');
  const runnerPath = path.join(workspaceRoot, 'packages', 'astro-engine', 'dist', 'adapters', runnerDistRelativePath);
  const tsxCliPath = path.join(workspaceRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');

  if (!existsSync(xuanshuRoot)) {
    throw new Error(
      'Chưa có runtime xuanshu nội bộ tại vendor/xuanshu-runtime. Các hệ xuanshu chỉ được bật khi runtime nội bộ này hiện diện và đồng bộ với bridge.',
    );
  }

  if (!existsSync(runnerPath)) {
    throw new Error(`Không tìm thấy runner bridge đã build: ${runnerDistRelativePath}. Hãy build @ziweiai/astro-engine trước khi chạy bridge xuanshu.`);
  }

  if (!existsSync(tsxCliPath)) {
    throw new Error('Không tìm thấy tsx CLI để chạy bridge xuanshu.');
  }

  return { xuanshuRoot, runnerPath, tsxCliPath };
}

export function isXuanshuReferenceRuntimeAvailable(): boolean {
  try {
    const workspaceRoot = findWorkspaceRoot();
    return existsSync(path.join(workspaceRoot, 'vendor', 'xuanshu-runtime'));
  } catch {
    return false;
  }
}

export function buildXuanshuRuntimeUnavailableConfidence(
  confidence: CalculationConfidence,
): CalculationConfidence {
  return {
    ...confidence,
    level: 'blocked',
    reasons: [...new Set([...confidence.reasons, XUANSHU_REFERENCE_RUNTIME_REASON])],
    visibleMessageKey: 'chart.runtime.reference-unavailable',
    blocksExactReading: true,
  };
}

export function formatXuanshuDateTime(input: BirthInput): string {
  const hour = input.time.hour ?? 0;
  const minute = input.time.minute ?? 0;

  return `${input.date.year}-${String(input.date.month).padStart(2, '0')}-${String(input.date.day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

export function buildXuanshuBridgeSettings(input: BirthInput): XuanshuBridgeSettings {
  return {
    name: '',
    occupy: '',
    sex: input.sexOrGenderForChart === 'female' ? 0 : 1,
    date: formatXuanshuDateTime(input),
    dateType: input.calendar === 'gregorian' ? 0 : 1,
    leapMonthType: input.calendar === 'lunar' && input.date.isLeapMonth ? 1 : 0,
  };
}

export async function runXuanshuBridge<TResult>(
  runnerDistRelativePath: string,
  settings: Record<string, unknown>,
  systemLabel: string,
): Promise<TResult> {
  const { xuanshuRoot, runnerPath, tsxCliPath } = resolveXuanshuBridgePaths(runnerDistRelativePath);

  return await new Promise<TResult>((resolve, reject) => {
    const child = spawn(process.execPath, [tsxCliPath, runnerPath], {
      cwd: xuanshuRoot,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    const timeoutHandle = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      child.kill();
      reject(new Error(`Bridge xuanshu ${systemLabel} quá thời gian chờ.`));
    }, 30000);

    const settleError = (error: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);
      reject(error);
    };

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      settleError(error);
    });

    child.on('close', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);

      if (code !== 0) {
        reject(new Error(stderr.trim() || `Bridge xuanshu ${systemLabel} thất bại.`));
        return;
      }

      try {
        resolve(JSON.parse(stdout) as TResult);
      } catch {
        reject(new Error(`Không thể parse JSON từ bridge xuanshu ${systemLabel}.`));
      }
    });

    child.stdin.write(JSON.stringify(settings));
    child.stdin.end();
  });
}

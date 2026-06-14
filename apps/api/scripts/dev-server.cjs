const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { resolveApiBuildOutputPaths } = require('./dev-server-path.cjs');

const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const { distRoot, entryFile } = resolveApiBuildOutputPaths(packageRoot);
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const envPath = path.join(repoRoot, '.env');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
const processEnv = { ...process.env };

let runtimeProcess = null;
let startupPoll = null;
let shuttingDown = false;

function waitForExit(childProcess, timeoutMs) {
  return new Promise((resolve) => {
    if (!childProcess || childProcess.exitCode !== null) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);
      childProcess.off('exit', handleExit);
    }

    function handleExit() {
      cleanup();
      resolve();
    }

    childProcess.once('exit', handleExit);
  });
}

async function terminateProcessTree(childProcess) {
  if (!childProcess || childProcess.exitCode !== null) {
    return;
  }

  if (process.platform === 'win32' && childProcess.pid) {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/PID', String(childProcess.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      killer.once('exit', () => resolve());
      killer.once('error', () => resolve());
    });
    await waitForExit(childProcess, 2000);
    return;
  }

  childProcess.kill('SIGTERM');
  await waitForExit(childProcess, 2000);

  if (childProcess.exitCode === null) {
    childProcess.kill('SIGKILL');
    await waitForExit(childProcess, 1000);
  }
}

try {
  fs.rmSync(distRoot, { force: true, recursive: true });
} catch (error) {
  if (error && error.code !== 'ENOENT') {
    throw error;
  }
}

const builderProcess = spawn(
  pnpmCommand,
  ['exec', 'nest', 'build', '--watch', '--preserveWatchOutput'],
  {
    cwd: packageRoot,
    env: processEnv,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  },
);

function startRuntimeWhenReady() {
  if (runtimeProcess || !fs.existsSync(entryFile)) {
    return;
  }

  runtimeProcess = spawn(process.execPath, ['--watch', entryFile], {
    cwd: packageRoot,
    env: processEnv,
    stdio: 'inherit',
  });

  runtimeProcess.on('exit', (code, signal) => {
    runtimeProcess = null;

    if (shuttingDown) {
      return;
    }

    if (signal || code === 0) {
      return;
    }

    stopAll(code ?? 1);
  });

  clearInterval(startupPoll);
  startupPoll = null;
}

async function stopAll(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (startupPoll) {
    clearInterval(startupPoll);
    startupPoll = null;
  }

  await Promise.allSettled([terminateProcessTree(runtimeProcess), terminateProcessTree(builderProcess)]);
  process.exit(exitCode);
}

startupPoll = setInterval(startRuntimeWhenReady, 250);
startRuntimeWhenReady();

builderProcess.on('exit', (code, signal) => {
  if (signal || code === 0 || shuttingDown) {
    void stopAll(code ?? 0);
    return;
  }

  void stopAll(code);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    void stopAll(0);
  });
}

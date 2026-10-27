import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const desktop = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(desktop, 'dist', `FolioForge-${process.platform}-${process.arch}`);
const executable = process.platform === 'darwin'
  ? join(root, 'FolioForge.app', 'Contents', 'MacOS', 'FolioForge')
  : join(root, process.platform === 'win32' ? 'FolioForge.exe' : 'FolioForge');
const output = join(desktop, 'work', 'packaged-smoke');
await mkdir(output, { recursive: true });
const child = spawn(executable, ['--smoke-test'], {
  stdio: 'inherit',
  env: { ...process.env, PIXELFORGE_TEST_OUTPUT: output },
  timeout: 120_000,
});
child.on('error', (error) => { console.error(error); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });

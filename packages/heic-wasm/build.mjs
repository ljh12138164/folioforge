import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const version = '0.2.129';
const installed = spawnSync('wasm-bindgen', ['--version'], { encoding: 'utf8' });
if (installed.stdout?.trim() !== `wasm-bindgen ${version}`) {
  run('cargo', ['install', 'wasm-bindgen-cli', '--version', version, '--locked']);
}
run('cargo', ['build', '--package', 'folioforge-heic', '--target', 'wasm32-unknown-unknown', '--release', '--locked']);
run('wasm-bindgen', ['target/wasm32-unknown-unknown/release/folioforge_heic.wasm', '--target', 'web', '--out-dir', 'packages/heic-wasm/pkg']);

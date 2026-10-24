import { spawnSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

const image = process.argv[2];
const revision = process.argv[3];
if (!image || !/^[0-9a-f]{40}$/.test(revision || '')) throw new Error('Usage: node scripts/test-runtime-image.mjs image revision');
const container = `folioforge-verify-${process.pid}`;
function docker(args) {
  const result = spawnSync('docker', args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`docker ${args[0]} failed`);
}
try {
  docker(['run', '-d', '--name', container, '-p', '127.0.0.1:18086:8080', image]);
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try { if ((await fetch('http://127.0.0.1:18086/healthz', { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await setTimeout(500);
  }
  if (!ready) throw new Error('Runtime failed to start');
  const result = spawnSync(process.execPath, ['scripts/verify-deployment.mjs', 'http://127.0.0.1:18086', revision], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Runtime HTTP checks failed');
} catch (error) {
  spawnSync('docker', ['logs', container], { stdio: 'inherit' });
  throw error;
} finally {
  spawnSync('docker', ['rm', '-f', container], { stdio: 'inherit' });
}

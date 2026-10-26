import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const root = new URL('../../../', import.meta.url);
const { version } = JSON.parse(readFileSync(new URL('apps/desktop/package.json', root), 'utf8'));
const workflow = readFileSync(new URL('.github/workflows/desktop.yml', root), 'utf8');
const script = workflow.match(/node --input-type=module <<'NODE'\r?\n([\s\S]*?)\r?\n          NODE/)[1].replace(/^ {10}/gm, '');

test.each([
  [`desktop-v${version}`, 0],
  [`desktop-v${version}-mismatch`, 1],
  [`v${version}`, 1],
])('release version gate: %s exits %s', (tag, status) => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fileURLToPath(root),
    env: { ...process.env, GITHUB_REF_NAME: tag },
    encoding: 'utf8',
  });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(status);
  if (status !== 0) expect(result.stderr).toContain('Tag must match');
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolve, posix, win32 } = require('node:path');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { assetPath } = require('../src/asset-path.cjs');

const root = resolve(__dirname, '../work/protocol-fixture/web');

test('bundled asset paths stay within the root', () => {
  assert.equal(assetPath(root, '/pdf/index.html'), resolve(root, 'pdf/index.html'));
  assert.equal(assetPath(root, '/%E9%A1%B5%E5%8C%A0%20sample.png'), resolve(root, '页匠 sample.png'));
  assert.equal(assetPath(root, '/'), root);
});

test('encoded traversal using either separator is rejected on every platform', () => {
  for (const pathname of ['/%2e%2e%5cpackage.json', '/%2e%2e%2fpackage.json', '/assets/%2e%2e%5c%2e%2e%5cprivate', '/%2e%2e%2fweb-other/private']) {
    assert.equal(assetPath(root, pathname), null, pathname);
  }
});

test('the actual resolver rejects backslash traversal with POSIX and Windows path rules', () => {
  const source = readFileSync(require.resolve('../src/asset-path.cjs'), 'utf8');
  for (const paths of [posix, win32]) {
    const exports = { exports: {} };
    runInNewContext(source, { module: exports, require: () => paths });
    assert.equal(exports.exports.assetPath(paths.resolve('/bundled/web'), '/%2e%2e%5cpackage.json'), null);
  }
});

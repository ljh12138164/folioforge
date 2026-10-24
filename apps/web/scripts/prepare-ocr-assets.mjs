import { createRequire } from 'node:module';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { downloadAsset } from './download-asset.mjs';

const require = createRequire(import.meta.url);
const target = fileURLToPath(new URL('../public/pdf-assets/ocr/v7/', import.meta.url));
const js = dirname(require.resolve('tesseract.js/package.json'));
const core = dirname(require.resolve('tesseract.js-core/package.json'));
await mkdir(resolve(target, 'core'), { recursive: true });
await mkdir(resolve(target, 'lang'), { recursive: true });
await copyFile(resolve(js, 'dist/worker.min.js'), resolve(target, 'worker.min.js'));
await copyFile(resolve(js, 'LICENSE.md'), resolve(target, 'TESSERACTJS-LICENSE.txt'));
await copyFile(resolve(core, 'LICENSE'), resolve(target, 'CORE-LICENSE.txt'));
// The app only uses OEM=1. Ship every LSTM device branch selected by the v7 loader.
for (const variant of ['lstm', 'simd-lstm', 'relaxedsimd-lstm']) {
  for (const suffix of ['wasm.js', 'wasm']) await copyFile(resolve(core, `tesseract-core-${variant}.${suffix}`), resolve(target, 'core', `tesseract-core-${variant}.${suffix}`));
}
const revision = '87416418657359cb625c412a48b6e1d6d41c29bd';
const base = `https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/${revision}/`;
const manifest = {};
const hashes = {
  'chi_sim.traineddata': 'a5fcb6f0db1e1d6d8522f39db4e848f05984669172e584e8d76b6b3141e1f730',
  'eng.traineddata': '7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2',
  LICENSE: 'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
};
for (const name of ['chi_sim.traineddata', 'eng.traineddata', 'LICENSE']) {
  const path = resolve(target, 'lang', name);
  let bytes;
  try { bytes = await readFile(path); } catch {}
  if (!bytes || createHash('sha256').update(bytes).digest('hex') !== hashes[name]) {
    bytes = await downloadAsset(base + name, hashes[name]);
    await writeFile(path, bytes);
  }
  manifest[name] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}
await writeFile(resolve(target, 'models.json'), JSON.stringify({ revision, files: manifest }, null, 2));
console.log('Pinned OCR v7 worker, LSTM cores and Chinese/English models prepared for local/offline use.');

import { createRequire } from 'node:module';
import { cp, mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(require.resolve('pdfjs-dist/package.json')));
const target = fileURLToPath(new URL('../public/pdf-assets/', import.meta.url));
await mkdir(target, { recursive: true });
await copyFile(resolve(root, 'build/pdf.worker.min.mjs'), resolve(target, 'pdf.worker.min.mjs'));
await copyFile(resolve(root, 'LICENSE'), resolve(target, 'PDFJS-LICENSE.txt'));
const pdfLib = dirname(require.resolve('pdf-lib/package.json'));
await copyFile(resolve(pdfLib, 'LICENSE.md'), resolve(target, 'PDFLIB-LICENSE.txt'));
for (const dir of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) await cp(resolve(root, dir), resolve(target, dir), { recursive: true });
console.log('PDF worker, fonts, CMaps and codecs copied for local use.');
await import('./prepare-ocr-assets.mjs');

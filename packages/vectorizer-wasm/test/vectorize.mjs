import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import init, { vectorize_svg } from '../pkg/folioforge_vectorizer.js';

const wasm = readFileSync(new URL('../pkg/folioforge_vectorizer_bg.wasm', import.meta.url));
await init({ module_or_path: wasm });
const rgba = new Uint8Array(64 * 48 * 4);
for (let y = 0; y < 48; y++) for (let x = 0; x < 64; x++) {
  rgba.set(x > 12 && x < 48 && y > 8 && y < 40 ? [220, 30, 30, 255] : [255, 255, 255, 255], (y * 64 + x) * 4);
}
for (const preset of ['poster', 'bw', 'photo']) {
  const svg = vectorize_svg(rgba, 64, 48, preset);
  assert.match(svg, /<svg[^>]*width="64" height="48"/);
  assert.match(svg, /<path /);
  assert.doesNotMatch(svg, /<image|base64|<script|href=/i);
  console.log(`PASS ${preset}: real paths, ${Buffer.byteLength(svg)}B`);
}
assert.match(vectorize_svg(new Uint8Array([255, 0, 0, 255]), 1, 1, 'poster'), /<path /);
for (const [width, height] of [[1, 7], [7, 1], [2, 2]]) {
  const tiny = Uint8Array.from({length:width*height*4}, (_, i) => i%4===0||i%4===3 ? 255 : 0);
  assert.match(vectorize_svg(tiny, width, height, 'poster'), /<path /);
}
assert.throws(() => vectorize_svg(rgba, 0, 48, 'poster'));
assert.throws(() => vectorize_svg(rgba, 2001, 2000, 'poster'));
assert.throws(() => vectorize_svg(rgba, 64, 47, 'poster'));
assert.throws(() => vectorize_svg(new Uint8Array(4), 1, 1, 'poster'));
assert.throws(() => vectorize_svg(rgba, 64, 48, 'invalid'));
console.log(`PASS dimensions, buffer, alpha and preset validation; WASM ${wasm.length}B / gzip ${gzipSync(wasm).length}B`);

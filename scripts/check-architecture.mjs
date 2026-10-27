import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(root, path), 'utf8');
const manifests = new Map();
for (const group of ['apps', 'packages']) {
  for (const directory of readdirSync(join(root, group))) {
    const path = `${group}/${directory}/package.json`;
    if (existsSync(join(root, path))) {
      const manifest = JSON.parse(read(path));
      manifests.set(manifest.name, { ...manifest, directory: `${group}/${directory}` });
    }
  }
}
function dependencies(name, visited = new Set()) {
  if (visited.has(name)) return visited;
  visited.add(name);
  for (const dependency of Object.keys(manifests.get(name)?.dependencies || {})) dependencies(dependency, visited);
  return visited;
}
function files(directory) {
  return readdirSync(join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? files(path) : [path];
  });
}
for (const [product, forbidden] of [
  ['pdf', /@pixelforge\/(?:image|heic|vectorizer)|magick-wasm/],
  ['image', /pdf-lib|pdfjs-dist|tesseract|@pixelforge\/pdf/],
]) {
  const name = `@pixelforge/${product}-web`;
  assert.ok(manifests.has(name), `Missing application: ${name}`);
  for (const dependency of dependencies(name)) assert.doesNotMatch(dependency, forbidden, `${name} includes ${dependency}`);
  const directory = manifests.get(name).directory;
  for (const file of files(`${directory}/src`).filter(file => /\.(?:tsx?|css)$/.test(file))) {
    const content = read(file);
    for (const match of content.matchAll(/(?:from\s*|import\s*\(?\s*|@import\s*)['"]([^'"]+)['"]/g)) {
      assert.doesNotMatch(match[1], forbidden, `${file} imports ${match[1]}`);
      assert.doesNotMatch(match[1], /(?:image|pdf)-web\//, `${file} imports another application`);
    }
  }
  if (process.argv.includes('--built')) {
    const output = `${directory}/out`;
    const expected = product === 'pdf' ? ['index.html', 'pdf/index.html', 'pdf-sw.js', 'pdf-assets/pdf.worker.min.mjs'] : ['index.html', 'convert/index.html', 'images/index.html', 'image-assets/HEIC-LICENSE.txt'];
    const absent = product === 'pdf' ? ['convert', 'images', 'image-assets', 'licenses/magick-wasm'] : ['pdf', 'pdf-assets', 'pdf-sw.js'];
    for (const path of expected) assert.ok(existsSync(join(root, output, path)), `${name} missing ${path}`);
    for (const path of absent) assert.ok(!existsSync(join(root, output, path)), `${name} leaks ${path}`);
    const html = read(`${output}/index.html`);
    assert.match(html, product === 'pdf' ? /PDF 工具箱/ : /图片格式转换/);
    assert.doesNotMatch(html, product === 'pdf' ? /href="\/(?:convert|images)\// : /href="\/pdf\//);
  }
  console.log(`${name}: dependency and source boundaries verified${process.argv.includes('--built') ? ', independent export verified' : ''}.`);
}

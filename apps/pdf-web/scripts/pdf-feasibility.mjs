// Research-only fixtures: no application code, OCR model, or new dependency.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { chromium } from '@playwright/test';

const require = createRequire(import.meta.url);
const web = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(web, 'work/pdf-feasibility');
const pdfjs = dirname(require.resolve('pdfjs-dist/package.json'));
const server = createServer(async (req, res) => {
  if (req.url === '/') return res.end('<!doctype html><title>PDF feasibility</title>');
  const name = req.url.slice(1);
  if (!/^(build\/pdf(?:\.worker\.min)?\.mjs|standard_fonts\/[\w.-]+)$/.test(name)) {
    res.writeHead(404); return res.end();
  }
  try {
    res.setHeader('Content-Type', name.endsWith('.mjs') ? 'text/javascript' : 'application/octet-stream');
    res.end(await readFile(resolve(pdfjs, name)));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(async () => {
    window.pdfjs = await import('/build/pdf.mjs');
    window.pdfjs.GlobalWorkerOptions.workerSrc = '/build/pdf.worker.min.mjs';
  });
  const fixedDate = new Date('2026-01-01T00:00:00Z');
  async function fresh() {
    const doc = await PDFDocument.create();
    doc.setCreationDate(fixedDate); doc.setModificationDate(fixedDate);
    return doc;
  }
  async function imagePdf(base64, format) {
    const doc = await fresh(), bytes = Buffer.from(base64, 'base64');
    const image = format === 'png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    doc.addPage([595.28, 841.89]).drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
    return doc.save();
  }
  const vector = await fresh(), font = await vector.embedFont(StandardFonts.Helvetica);
  for (let n = 1; n <= 3; n++) {
    const p = vector.addPage([595.28, 841.89]);
    p.drawRectangle({ x: 30, y: 30, width: 535, height: 781, borderWidth: .5, borderColor: rgb(.1, .4, .3) });
    for (let line = 0; line < 40; line++) p.drawText(`PAGE ${n} / ROW ${line + 1}: synthetic selectable PDF text 0123456789`, { x: 42, y: 780 - line * 18, size: 10, font });
  }
  const compact = await vector.save(), plain = await vector.save({ useObjectStreams: false });
  const resave = async bytes => (await PDFDocument.load(bytes, { updateMetadata: false })).save();
  const fixtures = [
    ['vector-object-streams', compact], ['vector-plain-objects', plain],
    ['vector-plain-resaved', await resave(plain)], ['vector-compact-resaved', await resave(compact)],
  ];
  const scans = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 2480; canvas.height = 3508;
    const ctx = canvas.getContext('2d'), image = ctx.createImageData(canvas.width, canvas.height);
    let seed = 42;
    for (let p = 0; p < image.data.length; p += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grey = 248 + (seed >>> 29);
      image.data[p] = image.data[p + 1] = image.data[p + 2] = grey; image.data[p + 3] = 255;
    }
    ctx.putImageData(image, 0, 0); ctx.fillStyle = '#111'; ctx.font = '42px sans-serif';
    for (let line = 0; line < 45; line++) ctx.fillText(`扫描件合成验证 ${line + 1} Synthetic scan 0123456789`, 130, 180 + line * 68);
    ctx.strokeStyle = '#777'; ctx.lineWidth = 2; ctx.strokeRect(110, 105, 2250, 3250);
    return [[300, 'png', null], [300, 'jpeg', .95], [150, 'jpeg', .8], [100, 'jpeg', .6]].map(([dpi, format, quality]) => {
      const target = document.createElement('canvas'); target.width = Math.round(2480 * dpi / 300); target.height = Math.round(3508 * dpi / 300);
      target.getContext('2d').drawImage(canvas, 0, 0, target.width, target.height);
      return { dpi, format, quality, width: target.width, height: target.height, base64: target.toDataURL(`image/${format}`, quality).split(',')[1] };
    });
  });
  for (const scan of scans) {
    const name = `scan-${scan.dpi}dpi-${scan.format}${scan.quality ?? ''}`;
    fixtures.push([name, await imagePdf(scan.base64, scan.format)]);
    await writeFile(resolve(output, `${name}.${scan.format}`), Buffer.from(scan.base64, 'base64'));
  }
  fixtures.push(['scan-png-resaved', await resave(fixtures.find(([name]) => name === 'scan-300dpi-png')[1])]);
  fixtures.push(['scan-jpeg-resaved', await resave(fixtures.find(([name]) => name === 'scan-300dpi-jpeg0.95')[1])]);
  const rasterize = bytes => page.evaluate(async base64 => {
    const data = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const task = window.pdfjs.getDocument({ data, standardFontDataUrl: '/standard_fonts/' });
    const doc = await task.promise, pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const p = await doc.getPage(n), viewport = p.getViewport({ scale: 150 / 72 });
      const canvas = document.createElement('canvas'); canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);
      await p.render({ canvas, viewport, background: '#fff' }).promise;
      pages.push(canvas.toDataURL('image/jpeg', .8).split(',')[1]); canvas.width = canvas.height = 0;
    }
    await task.destroy(); return pages;
  }, Buffer.from(bytes).toString('base64'));
  const raster = await rasterize(compact);
  const rasterDoc = await fresh();
  for (const base64 of raster) {
    const image = await rasterDoc.embedJpg(Buffer.from(base64, 'base64'));
    rasterDoc.addPage([595.28, 841.89]).drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
  }
  fixtures.push(['vector-raster-150dpi-jpeg0.8', await rasterDoc.save()]);
  const [scanRaster] = await rasterize(fixtures.find(([name]) => name === 'scan-300dpi-png')[1]);
  fixtures.push(['scan-pdf-raster-150dpi-jpeg0.8', await imagePdf(scanRaster, 'jpeg')]);
  const results = [];
  for (const [name, bytes] of fixtures) {
    const task = getDocument({ data: bytes.slice(), standardFontDataUrl: pdfjs.replaceAll('\\', '/') + '/standard_fonts/' });
    const doc = await task.promise;
    let textChars = 0;
    for (let n = 1; n <= doc.numPages; n++) textChars += (await (await doc.getPage(n)).getTextContent()).items.reduce((sum, item) => sum + (item.str?.length || 0), 0);
    const parsed = await PDFDocument.load(bytes);
    results.push({ name, bytes: bytes.length, pages: doc.numPages, textChars, pagePt: parsed.getPage(0).getSize() });
    await task.destroy(); await writeFile(resolve(output, `${name}.pdf`), bytes);
  }
  assert(results.find(r => r.name === 'vector-compact-resaved').textChars > 0);
  assert.equal(results.find(r => r.name === 'vector-raster-150dpi-jpeg0.8').textChars, 0);
  assert(results.every(r => r.pages === (r.name.startsWith('vector') ? 3 : 1)));
  const report = { node: process.version, browser: browser.version(), pdfLib: require('pdf-lib/package.json').version, pdfjs: require('pdfjs-dist/package.json').version, scans: scans.map(({ base64, ...s }) => ({ ...s, imageBytes: Buffer.from(base64, 'base64').length })), results };
  await writeFile(resolve(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve));
}

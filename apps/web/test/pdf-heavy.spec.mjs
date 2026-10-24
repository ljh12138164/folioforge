import { test, expect } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const shots = resolve('work/test-results/visual/pdf-heavy');
const add = (page, bytes, name = 'synthetic.pdf') => page.getByLabel('导入 PDF 或图片', { exact: true }).setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) });
async function download(page, info, name) {
  const event = page.waitForEvent('download'); await page.getByRole('link', { name: '下载结果', exact: true }).click();
  const path = info.outputPath(name); await (await event).saveAs(path); return new Uint8Array(await readFile(path));
}
async function scan(page, noisy = false) {
  const png = await page.evaluate(async noise => {
    const c = document.createElement('canvas'); c.width = noise ? 1800 : 1600; c.height = noise ? 2400 : 2000;
    const ctx = c.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, c.width, c.height);
    if (noise) {
      const pixels = ctx.getImageData(0, 0, c.width, c.height); let seed = 42;
      for (let i = 0; i < pixels.data.length; i += 4) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const value = 200 + seed % 56; pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value; }
      ctx.putImageData(pixels, 0, 0);
    }
    ctx.fillStyle = 'black'; ctx.font = '80px Arial'; ctx.fillText('PIXELFORGE LOCAL OCR', 100, 220);
    ctx.font = '100px "Microsoft YaHei", sans-serif'; ctx.fillText('你好世界 中文测试', 100, 430);
    return Array.from(new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/png'))).arrayBuffer()));
  }, noisy);
  const doc = await PDFDocument.create(), image = await doc.embedPng(new Uint8Array(png));
  doc.addPage([400, 500]).drawImage(image, { x: 0, y: 0, width: 400, height: 500 });
  return doc.save();
}
async function textPdf(count = 2) {
  const doc = await PDFDocument.create(), font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < count; i++) doc.addPage([400, 500]).drawText(`KEEP VECTOR TEXT ${i + 1}`, { x: 40, y: 300, font, size: 20 });
  return doc.save({ useObjectStreams: false });
}
async function readText(bytes) {
  const doc = await getDocument({ data: bytes.slice(), standardFontDataUrl: resolve('node_modules/pdfjs-dist/standard_fonts').replaceAll('\\', '/') + '/' }).promise;
  const page = await doc.getPage(1), text = await page.getTextContent(), view = page.getViewport({ scale: 1 });
  const result = { text: text.items.map(i => i.str || '').join(''), items: text.items, width: view.width, height: view.height };
  await doc.loadingTask.destroy(); return result;
}
async function capture(page, name) {
  await mkdir(shots, { recursive: true }); await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: resolve(shots, name), fullPage: true, animations: 'disabled' });
}

test('real offline Chinese/English OCR produces TXT and searchable PDF with page coordinates', async ({ page, context }, info) => {
  const external = []; page.on('request', req => { if (/^https?:/.test(req.url()) && new URL(req.url()).origin !== 'http://127.0.0.1:43188') external.push(req.url()); });
  await page.goto('/pdf/?tool=ocr'); const bytes = await scan(page);
  await expect(page.locator('.pdf-footer')).toContainText('离线资源已就绪', { timeout: 90_000 });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller); await context.setOffline(true); await page.reload(); await add(page, bytes, '中英扫描-合成示例.pdf');
  await page.getByRole('button', { name: '开始 OCR', exact: true }).click();
  await expect(page.locator('.pdf-result')).toBeVisible({ timeout: 90_000 });
  const text = new TextDecoder().decode(await download(page, info, 'ocr.txt')).replaceAll(/\s/g, '');
  expect(text).toContain('PIXELFORGELOCALOCR'); expect(text).toContain('你好世界'); expect(text).toContain('中文测试');
  await expect(page.locator('.pdf-text-page')).toContainText('你好世界');
  await page.getByRole('searchbox', { name: '搜索提取文字', exact: true }).fill('你好'); await expect(page.locator('.pdf-text-page mark')).toContainText('你好');
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.getByRole('button', { name: /^浅色(?:模式)?$/ }).click(); await capture(page, 'ocr-desktop.png');
  await page.getByRole('combobox', { name: 'OCR 输出', exact: true }).selectOption('pdf');
  await page.getByRole('button', { name: '开始 OCR', exact: true }).click(); await expect(page.locator('.pdf-result')).toBeVisible({ timeout: 90_000 });
  const pdf = await download(page, info, 'searchable.pdf'), parsed = await readText(pdf);
  expect(parsed.text.replaceAll(/\s/g, '')).toContain('你好世界'); expect(parsed.text).toContain('PIXELFORGE'); expect(parsed.width).toBeCloseTo(400); expect(parsed.height).toBeCloseTo(500);
  const english = parsed.items.find(i => i.str?.includes('PIXELFORGE')); expect(english.transform[4]).toBeGreaterThan(15); expect(english.transform[4]).toBeLessThan(60); expect(english.transform[5]).toBeGreaterThan(425); expect(english.transform[5]).toBeLessThan(465);
  await page.getByRole('button', { name: '预览结果首页', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'PDF 输出预览' }).locator('img')).toBeVisible(); await capture(page, 'ocr-output.png'); await page.getByRole('button', { name: '关闭输出预览', exact: true }).click();
  for (const width of [390, 310]) { await page.setViewportSize({ width, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await capture(page, width === 390 ? 'mobile.png' : 'user-310.png'); }
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.getByRole('button', { name: /^深色(?:模式)?$/ }).click(); await capture(page, 'ocr-dark.png');
  expect(external).toEqual([]); await context.setOffline(false);
});

test('OCR keeps existing text without duplication, obeys page range, limits and cancellation', async ({ page }, info) => {
  await page.goto('/pdf/?tool=ocr'); await add(page, await textPdf(21));
  await page.getByRole('button', { name: '开始 OCR', exact: true }).click(); await expect(page.locator('.pdf-errors')).toContainText('最多 20 页');
  await page.getByRole('textbox', { name: '按当前顺序选择页码', exact: true }).fill('2'); await page.getByRole('button', { name: '选择', exact: true }).click(); await page.getByRole('radio', { name: /选中的页面/ }).check();
  await page.getByRole('combobox', { name: 'OCR 输出', exact: true }).selectOption('pdf'); await page.getByRole('button', { name: '开始 OCR', exact: true }).click(); await expect(page.locator('.pdf-result')).toBeVisible();
  const output = await download(page, info, 'existing.pdf'); expect((await PDFDocument.load(output)).getPageCount()).toBe(1); expect((await readText(output)).text).toBe('KEEP VECTOR TEXT 2');
  await page.getByRole('checkbox', { name: '重新识别已有文字的页面', exact: true }).check();
  await page.getByRole('button', { name: '开始 OCR', exact: true }).click(); await page.getByRole('button', { name: '取消操作', exact: true }).click(); await expect(page.getByRole('button', { name: '开始 OCR', exact: true })).toBeEnabled(); await expect(page.locator('.pdf-result')).toHaveCount(0);
});

test('compression preserves vectors, downsamples real scans and falls back when larger', async ({ page, context }, info) => {
  await page.goto('/pdf/?tool=compress'); const vector = await textPdf(5); await add(page, vector);
  await page.getByRole('button', { name: '压缩并比较体积', exact: true }).click(); await expect(page.locator('.pdf-result')).toContainText('页面内容未降采样');
  const optimized = await download(page, info, 'optimized.pdf'); expect(optimized.length).toBeLessThan(vector.length); expect((await readText(optimized)).text).toBe('KEEP VECTOR TEXT 1');
  await page.getByRole('combobox', { name: '压缩方式', exact: true }).selectOption('scan'); await expect(page.getByRole('button', { name: '压缩并比较体积', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: '我了解内容损失，生成图片页 PDF', exact: true }).check(); await page.getByRole('button', { name: '压缩并比较体积', exact: true }).click(); await expect(page.locator('.pdf-result')).toContainText('未缩小');
  expect(await download(page, info, 'fallback.pdf')).toEqual(vector);
  page.once('dialog', d => d.accept()); await page.getByRole('button', { name: '清空 PDF 任务', exact: true }).click(); const noisy = await scan(page, true); await add(page, noisy, '扫描件-合成噪声.pdf');
  await expect(page.locator('.pdf-footer')).toContainText('离线资源已就绪', { timeout: 90_000 }); await context.setOffline(true);
  await page.getByRole('button', { name: '压缩并比较体积', exact: true }).click(); await expect(page.locator('.pdf-result')).toContainText('输出为图片页');
  const compressed = await download(page, info, 'scan-compressed.pdf'); expect(compressed.length).toBeLessThan(noisy.length); const parsed = await readText(compressed); expect(parsed.text).toBe(''); expect(parsed.width).toBeCloseTo(400); expect(parsed.height).toBeCloseTo(500);
  await page.getByRole('button', { name: '预览结果首页', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'PDF 输出预览' }).locator('img')).toBeVisible(); await capture(page, 'compress-output.png'); await page.getByRole('button', { name: '关闭输出预览', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.getByRole('button', { name: /^浅色(?:模式)?$/ }).click(); await capture(page, 'compress-desktop.png');
  await page.setViewportSize({ width: 310, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await capture(page, 'compress-310.png');
  await context.setOffline(false);
});

test('OCR model load failure is recoverable and never produces a partial download', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'block' }); const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:43188/pdf/?tool=ocr'); await add(page, await scan(page));
    await context.route('**/lang/*.traineddata', route => route.abort());
    await page.getByRole('button', { name: '开始 OCR', exact: true }).click();
    await expect(page.locator('.pdf-errors')).toContainText('OCR 处理失败'); await expect(page.locator('.pdf-result')).toHaveCount(0); await expect(page.getByRole('button', { name: '开始 OCR', exact: true })).toBeEnabled();
    await context.unroute('**/lang/*.traineddata'); await page.getByRole('button', { name: '开始 OCR', exact: true }).click();
    await expect(page.locator('.pdf-result')).toBeVisible({ timeout: 90_000 }); await expect(page.locator('.pdf-text-page')).toContainText('你好世界');
  } finally { await context.close(); }
});

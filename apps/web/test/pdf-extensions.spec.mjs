import { test, expect } from '@playwright/test';
import { PDFDocument, PDFName, PDFNumber, StandardFonts, degrees, rgb } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const shots = resolve('work/test-results/visual/pdf-next');
const readPdf = bytes => getDocument({ data: bytes.slice(), standardFontDataUrl: resolve('node_modules/pdfjs-dist/standard_fonts').replaceAll('\\', '/') + '/' }).promise;
async function capture(page, name) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: resolve(shots, name), fullPage: name !== 'watermark-preview.png' });
}
const importFile = (page, buffer, name = '合成测试.pdf') => page.getByLabel('导入 PDF 或图片', { exact: true }).setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from(buffer) });
async function fixture(blank = false) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const rotation of [0, 90, 180, 270]) {
    const page = doc.addPage([300, 420]);
    page.setMediaBox(10, 20, 300, 420); page.setCropBox(30, 40, 200, 300); page.setRotation(degrees(rotation));
    page.node.set(PDFName.of('UserUnit'), PDFNumber.of(2));
    if (!blank) {
      page.drawText(`VISIBLE ${rotation}`, { x: 70, y: 170, size: 12, font });
      page.drawRectangle({ x: 40, y: 50, width: 15, height: 15, color: rgb(1, 0, 0) });
      page.drawRectangle({ x: 205, y: 315, width: 15, height: 15, color: rgb(0, 0, 1) });
    }
  }
  doc.addPage([200, 300]);
  return doc.save();
}
async function apply(page, count) {
  await page.getByRole('button', { name: `应用到 ${count} 页`, exact: true }).click();
  await expect(page.locator('.pdf-applied')).toBeVisible();
  await expect(page.locator('.pdf-page-image img')).toHaveCount(count);
}
async function download(page, info, filename) {
  const event = page.waitForEvent('download');
  await page.getByRole('link', { name: '下载结果', exact: true }).click();
  const item = await event, path = info.outputPath(filename);
  await item.saveAs(path);
  return new Uint8Array(await readFile(path));
}
async function pdfOutput(page, info, name) {
  await page.getByRole('button', { name: '生成 PDF', exact: true }).click();
  await expect(page.getByRole('link', { name: '下载结果', exact: true })).toBeVisible();
  return download(page, info, name);
}

test('page numbers and Chinese watermark chain, preserve text, and undo real results', async ({ page }, info) => {
  await page.goto('/pdf/?tool=numbers');
  await importFile(page, await fixture());
  await expect(page.locator('.pdf-page')).toHaveCount(5);
  await page.getByLabel('起始页码', { exact: true }).fill('5');
  await page.getByRole('combobox', { name: '对齐方式', exact: true }).selectOption('right');
  await apply(page, 5);
  const numbered = await readPdf(await pdfOutput(page, info, 'numbers.pdf'));
  for (let i = 0; i < 5; i++) {
    const p = await numbered.getPage(i + 1), content = await p.getTextContent();
    const item = content.items.find(item => 'str' in item && item.str === `${i + 5} / 9`);
    expect(item).toBeTruthy();
    const viewport = p.getViewport({ scale: 1 });
    const [, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
    expect(viewport.height - y).toBeCloseTo(16, 0); // Physical pt even at UserUnit=2 and all rotations.
  }
  await numbered.destroy?.();
  await page.getByRole('button', { name: '文字水印', exact: true }).click();
  await page.getByLabel('水印文字', { exact: true }).fill('内部资料 · 合成测试');
  await page.getByLabel('不透明度（%）', { exact: true }).fill('60');
  await apply(page, 5);
  const watermarked = await pdfOutput(page, info, 'watermark.pdf');
  const doc = await PDFDocument.load(watermarked);
  for (const p of doc.getPages()) expect(p.node.Resources().lookup(PDFName.of('XObject')).keys().length).toBeGreaterThan(0);
  const rendered = await readPdf(watermarked);
  const blank = await rendered.getPage(5), viewport = blank.getViewport({ scale: 1 });
  const { canvas, context } = rendered.canvasFactory.create(viewport.width, viewport.height);
  await blank.render({ canvas, canvasContext: context, viewport }).promise;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  expect(Array.from(pixels).filter((value, i) => i % 4 !== 3 && value < 200).length).toBeGreaterThan(1000);
  expect((await (await rendered.getPage(1)).getTextContent()).items.map(item => item.str || '').join('')).toContain('VISIBLE 0');
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  const undone = await PDFDocument.load(await pdfOutput(page, info, 'undo-watermark.pdf'));
  expect(undone.getPage(4).node.Resources().lookup(PDFName.of('XObject')).keys()).toHaveLength(0);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  const redone = await PDFDocument.load(await pdfOutput(page, info, 'redo-watermark.pdf'));
  expect(redone.getPage(4).node.Resources().lookup(PDFName.of('XObject')).keys().length).toBeGreaterThan(0);
});

test('crop validates atomically; A4 and 2/4-up preserve visible text and selected-page ordering', async ({ page }, info) => {
  await page.goto('/pdf/?tool=layout&layout=fit');
  await importFile(page, await fixture());
  await expect(page.getByRole('combobox', { name: '版式操作', exact: true })).toHaveValue('fit');
  await page.getByRole('combobox', { name: '版式操作', exact: true }).selectOption('crop');
  await page.getByLabel('上边裁剪（mm）', { exact: true }).fill('200');
  await page.getByRole('button', { name: '应用到 5 页', exact: true }).click();
  await expect(page.locator('.pdf-errors')).toContainText('第 2 页裁剪后过小');
  expect((await PDFDocument.load(await pdfOutput(page, info, 'unchanged.pdf'))).getPage(0).getCropBox().width).toBe(200);
  await page.getByLabel('上边裁剪（mm）', { exact: true }).fill('5');
  await apply(page, 5);
  const cropped = await PDFDocument.load(await pdfOutput(page, info, 'crop.pdf'));
  expect(cropped.getPage(0).getCropBox().width).toBeCloseTo(200 - 10 * 72 / 25.4 / 2);
  await page.getByRole('combobox', { name: '版式操作', exact: true }).selectOption('fit');
  await apply(page, 5);
  const fitted = await readPdf(await pdfOutput(page, info, 'a4.pdf'));
  for (let i = 1; i <= 4; i++) {
    const p = await fitted.getPage(i), content = await p.getTextContent();
    expect(p.view[2]).toBeCloseTo(595.28);
    expect(p.view[3]).toBeCloseTo(841.89);
    expect(content.items.map(item => item.str || '').join('')).toContain(`VISIBLE ${(i - 1) * 90}`);
  }
  await page.getByRole('combobox', { name: '版式操作', exact: true }).selectOption('nup');
  await page.getByRole('button', { name: '应用到 5 页', exact: true }).click();
  await expect(page.locator('.pdf-page')).toHaveCount(3);
  const two = await readPdf(await pdfOutput(page, info, '2up.pdf'));
  expect(two.numPages).toBe(3);
  const firstText = (await (await two.getPage(1)).getTextContent()).items.map(item => item.str || '').join(' ');
  expect(firstText).toContain('VISIBLE 0'); expect(firstText).toContain('VISIBLE 90');
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(page.locator('.pdf-page')).toHaveCount(5);
  await page.getByRole('combobox', { name: '每张纸的页数', exact: true }).selectOption('4');
  await page.getByRole('button', { name: '应用到 5 页', exact: true }).click();
  await expect(page.locator('.pdf-page')).toHaveCount(2);
  expect((await PDFDocument.load(await pdfOutput(page, info, '4up.pdf'))).getPageCount()).toBe(2);
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await page.getByLabel('全选页面', { exact: true }).uncheck();
  await page.getByLabel('选择第 2 页', { exact: true }).check();
  await page.getByLabel('选择第 4 页', { exact: true }).check();
  await page.getByRole('radio', { name: /选中的页面/ }).check();
  await page.getByRole('button', { name: '应用到 2 页', exact: true }).click();
  await expect(page.locator('.pdf-page')).toHaveCount(4);
  await page.getByRole('radio', { name: /全部页面/ }).check();
  const selected = await readPdf(await pdfOutput(page, info, 'selected.pdf'));
  const strings = [];
  for (let i = 1; i <= 4; i++) strings.push((await (await selected.getPage(i)).getTextContent()).items.map(item => item.str || '').join(' '));
  expect(strings[0]).toContain('VISIBLE 0'); expect(strings[1]).toContain('VISIBLE 90'); expect(strings[1]).toContain('VISIBLE 270'); expect(strings[2]).toContain('VISIBLE 180'); expect(strings[3]).toBe('');
});

test('text extraction searches literal terms, downloads TXT, handles scans, and clears stale text', async ({ page }, info) => {
  await page.goto('/pdf/?tool=text');
  await importFile(page, await fixture());
  await page.getByRole('button', { name: '提取文字并生成 TXT', exact: true }).click();
  await expect(page.locator('.pdf-text-page')).toHaveCount(5);
  await expect(page.getByLabel('第 5 页提取文字', { exact: true })).toContainText('未提取到文字');
  const txt = new TextDecoder().decode(await download(page, info, 'text.txt'));
  expect(txt).toContain('第 1 页'); expect(txt).toContain('VISIBLE 270');
  await page.getByLabel('搜索提取文字', { exact: true }).fill('visible 90');
  await expect(page.locator('.pdf-text-page')).toHaveCount(1);
  await expect(page.locator('.pdf-text-page mark')).toHaveText('VISIBLE 90');
  await page.getByRole('button', { name: /第 2 页.*查看原页/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '关闭页面预览', exact: true }).click();
  await page.getByLabel('搜索提取文字', { exact: true }).fill('[');
  await expect(page.getByText('没有匹配文字，请更换关键词。')).toBeVisible();
  await page.getByRole('button', { name: '整理与合并', exact: true }).click();
  await page.getByRole('button', { name: '旋转第 1 页', exact: true }).click();
  await page.getByRole('button', { name: '提取文字', exact: true }).click();
  await expect(page.locator('.pdf-text-page')).toHaveCount(0);
});

test('cold offline first use includes Chinese stamps, layout and text extraction', async ({ page, context }, info) => {
  const external = [];
  page.on('request', req => { if (!req.url().startsWith('blob:') && new URL(req.url()).origin !== 'http://127.0.0.1:43188') external.push(req.url()); expect(req.method()).toBe('GET'); });
  await page.goto('/pdf/?tool=watermark');
  await expect(page.locator('.pdf-footer')).toContainText('离线资源已就绪', { timeout: 90_000 });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true); await page.reload();
  await importFile(page, await fixture());
  await page.getByLabel('水印文字', { exact: true }).fill('离线中文水印'); await apply(page, 5);
  await page.getByRole('button', { name: '裁剪与排版', exact: true }).click();
  await page.getByRole('combobox', { name: '版式操作', exact: true }).selectOption('nup');
  await page.getByRole('button', { name: '应用到 5 页', exact: true }).click();
  await expect(page.locator('.pdf-page')).toHaveCount(3);
  await page.getByRole('button', { name: '提取文字', exact: true }).click();
  await page.getByRole('button', { name: '提取文字并生成 TXT', exact: true }).click();
  await expect(page.locator('.pdf-text-page')).toHaveCount(3);
  expect(new TextDecoder().decode(await download(page, info, 'offline-text.txt'))).toContain('VISIBLE 270');
  expect(external).toEqual([]); await context.setOffline(false);
});

test('extension visual states at desktop, mobile, narrow panel and dark theme', async ({ page }) => {
  await mkdir(shots, { recursive: true });
  await page.goto('/pdf/?tool=watermark');
  await page.getByRole('button', { name: '载入示例文档', exact: true }).click();
  await page.getByLabel('水印文字', { exact: true }).fill('内部资料 · 合成示例');
  await apply(page, 3);
  await page.getByRole('button', { name: /^浅色(?:模式)?$/ }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture(page, 'desktop.png');
  await page.getByRole('button', { name: '预览第 1 页', exact: true }).click();
  await expect(page.locator('dialog img')).toBeVisible();
  await capture(page, 'watermark-preview.png');
  await page.getByRole('button', { name: '关闭页面预览', exact: true }).click();
  for (const [width, name] of [[390, 'mobile.png'], [310, 'user-310.png']]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(page, name);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: /^深色(?:模式)?$/ }).click();
  await capture(page, 'dark-desktop.png');
  await page.getByRole('button', { name: /^浅色(?:模式)?$/ }).click();
  await page.getByRole('button', { name: '裁剪与排版', exact: true }).click();
  await page.getByRole('combobox', { name: '版式操作', exact: true }).selectOption('nup');
  await page.getByRole('button', { name: '应用到 3 页', exact: true }).click();
  await expect(page.locator('.pdf-page-image img')).toHaveCount(2);
  await capture(page, 'layout.png');
  await page.getByRole('button', { name: '提取文字', exact: true }).click();
  await page.getByRole('button', { name: '提取文字并生成 TXT', exact: true }).click();
  await expect(page.locator('.pdf-text-page')).toHaveCount(2);
  await page.getByLabel('搜索提取文字', { exact: true }).fill('local');
  await capture(page, 'text.png');
});

import { test, expect } from '@playwright/test';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { unzipSync } from 'fflate';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const screenshots = resolve('work/test-results/visual/pdf');
const source = async (widths, rotation = 0) => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  widths.forEach((width, i) => {
    const page = doc.addPage([width, 310 + i * 10]);
    page.setRotation(degrees(rotation));
    page.drawRectangle({ x: 10, y: 10, width: width - 20, height: 30, color: rgb(.1, .4, .25) });
    page.drawText(`Test page ${width}`, { x: 15, y: 100, font, size: 15 });
  });
  return Buffer.from(await doc.save());
};
const add = (page, files) => page.getByLabel('导入 PDF 或图片', { exact: true }).setInputFiles(files);
const pdfFile = (name, buffer) => ({ name, mimeType: 'application/pdf', buffer });
async function download(page, testInfo, filename) {
  const event = page.waitForEvent('download');
  await page.getByRole('link', { name: '下载结果', exact: true }).click();
  const item = await event;
  const path = testInfo.outputPath(filename);
  await item.saveAs(path);
  return new Uint8Array(await readFile(path));
}
async function generate(page, zip = false) {
  await page.getByRole('button', { name: zip ? '生成 ZIP' : '生成 PDF', exact: true }).click();
  await expect(page.getByRole('link', { name: '下载结果', exact: true })).toBeVisible();
}
async function thumbnails(page) {
  await expect(page.locator('.pdf-page-image img').first()).toBeVisible();
  await expect.poll(() => page.locator('.pdf-page-image img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0) && images.length)).toBeGreaterThan(0);
}

test('tool directory filters, searches and opens the selected PDF tool', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'PDF 与图片工具箱' })).toBeVisible();
  await expect(page.locator('.tools-entry')).toHaveCount(21);
  await page.getByRole('button', { name: /^图片\s*2$/ }).click();
  await expect(page.locator('.tools-entry')).toHaveCount(2);
  await page.getByLabel('搜索工具').fill('不存在的工具');
  await expect(page.getByText('没有找到相关工具')).toBeVisible();
  await page.getByRole('button', { name: '查看全部工具', exact: true }).click();
  await page.getByLabel('搜索工具').fill('拆分');
  await expect(page.locator('.tools-entry')).toHaveCount(1);
  await page.locator('.tools-entry').click();
  await expect(page.getByRole('button', { name: '拆分文档', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('local merge, reorder, rotate, selection, history, preview and extraction', async ({ page }, testInfo) => {
  const requests = [];
  page.on('request', request => requests.push({ method: request.method(), url: request.url() }));
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  await page.goto('/pdf/');
  await add(page, [pdfFile('合同-A.pdf', await source([210, 220])), pdfFile('合同-B.pdf', await source([230]))]);
  await expect(page.locator('.pdf-page')).toHaveCount(3);
  await thumbnails(page);
  await page.getByRole('button', { name: '前移第 3 页', exact: true }).click();
  await page.getByRole('button', { name: '前移第 2 页', exact: true }).click();
  await page.getByRole('button', { name: '旋转第 1 页', exact: true }).click();
  await page.getByLabel('选择第 2 页', { exact: true }).check();
  await page.getByRole('button', { name: '删除', exact: true }).click();
  await expect(page.locator('.pdf-page')).toHaveCount(2);
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(page.locator('.pdf-page')).toHaveCount(3);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(page.locator('.pdf-page')).toHaveCount(2);
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await page.getByRole('button', { name: '预览第 1 页', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('dialog img')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByLabel('文件名', { exact: true }).fill('整理结果');
  await generate(page);
  const result = await PDFDocument.load(await download(page, testInfo, 'merged.pdf'));
  expect(result.getPages().map(p => p.getWidth())).toEqual([230, 210, 220]);
  expect(result.getPages().map(p => p.getRotation().angle)).toEqual([90, 0, 0]);
  await page.getByRole('button', { name: '提取页面', exact: true }).click();
  await page.getByLabel('按当前顺序选择页码', { exact: true }).fill('0-999');
  await page.getByRole('button', { name: '选择', exact: true }).click();
  await expect(page.locator('#pdf-range-error')).toContainText('1–3');
  await page.getByLabel('按当前顺序选择页码', { exact: true }).fill('1, 3');
  await page.getByRole('button', { name: '选择', exact: true }).click();
  await generate(page);
  const extracted = await PDFDocument.load(await download(page, testInfo, 'extracted.pdf'));
  expect(extracted.getPages().map(p => p.getWidth())).toEqual([230, 220]);
  expect(extracted.getPages().map(p => p.getRotation().angle)).toEqual([90, 0]);
  expect(failures).toEqual([]);
  expect(requests.filter(r => r.method !== 'GET' || new URL(r.url).origin !== 'http://127.0.0.1:43188')).toEqual([]);
});

test('split ZIP, real PNG/JPG export, image-to-PDF and malformed input recovery', async ({ page }, testInfo) => {
  await page.goto('/pdf/?tool=split');
  const form = await PDFDocument.create();
  form.getForm().createTextField('name').addToPage(form.addPage());
  await add(page, [pdfFile('broken.pdf', Buffer.from('%PDF- invalid')), pdfFile('form.pdf', Buffer.from(await form.save())), pdfFile('有效.pdf', await source([210, 220]))]);
  await expect(page.locator('.pdf-page')).toHaveCount(2);
  await expect(page.locator('.pdf-errors')).toContainText('交互表单');
  await expect(page.locator('.pdf-errors')).toContainText('损坏');
  await generate(page, true);
  const split = Object.values(unzipSync(await download(page, testInfo, 'split.zip')));
  expect(split).toHaveLength(2);
  expect((await PDFDocument.load(split[1])).getPageCount()).toBe(1);
  expect((await PDFDocument.load(split[1])).getPage(0).getWidth()).toBe(220);
  await page.getByRole('button', { name: '转为图片', exact: true }).click();
  await generate(page, true);
  const pngs = Object.values(unzipSync(await download(page, testInfo, 'pngs.zip')));
  expect(pngs).toHaveLength(2);
  expect(Buffer.from(pngs[0].slice(1, 4)).toString()).toBe('PNG');
  const view = new DataView(pngs[0].buffer, pngs[0].byteOffset);
  expect(view.getUint32(16)).toBe(420);
  expect(view.getUint32(20)).toBe(620);
  await page.getByLabel('输出格式', { exact: true }).selectOption('jpg');
  await generate(page, true);
  const jpgs = Object.values(unzipSync(await download(page, testInfo, 'jpgs.zip')));
  expect([...jpgs[0].slice(0, 3)]).toEqual([255, 216, 255]);
  // Real image bytes from the previous export become a fresh A4 PDF page.
  await add(page, [{ name: 'image.png', mimeType: 'image/png', buffer: Buffer.from(pngs[0]) }]);
  await expect(page.locator('.pdf-page')).toHaveCount(3);
  await page.getByRole('button', { name: '整理与合并', exact: true }).click();
  await generate(page);
  const imagesPdf = await PDFDocument.load(await download(page, testInfo, 'images.pdf'));
  expect(imagesPdf.getPageCount()).toBe(3);
  expect(imagesPdf.getPage(2).getWidth()).toBeCloseTo(595.28);
  expect(imagesPdf.getPage(2).getHeight()).toBeCloseTo(841.89);
});

test('cold offline reload still loads the PDF engine, sample, renderer and exports', async ({ page, context }, testInfo) => {
  await page.goto('/pdf/');
  await expect(page.locator('.pdf-footer')).toContainText('离线资源已就绪', { timeout: 90_000 });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'PDF 工作台' })).toBeVisible();
  await expect(page.locator('.pdf-footer')).toContainText('正在离线使用');
  await page.getByRole('button', { name: '载入示例文档', exact: true }).click();
  await expect(page.locator('.pdf-page')).toHaveCount(3);
  await thumbnails(page);
  await generate(page);
  expect((await PDFDocument.load(await download(page, testInfo, 'offline.pdf'))).getPageCount()).toBe(3);
  await page.getByRole('button', { name: '转为图片', exact: true }).click();
  await generate(page, true);
  expect(Object.keys(unzipSync(await download(page, testInfo, 'offline-images.zip')))).toHaveLength(3);
  await context.setOffline(false);
});

test('responsive visual coverage and tool-site screenshots', async ({ page }) => {
  await mkdir(screenshots, { recursive: true });
  await page.goto('/');
  await page.getByRole('button', { name: '浅色', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: resolve(screenshots, 'home-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(screenshots, 'home-mobile.png'), fullPage: true });
  await page.goto('/pdf/');
  await page.getByRole('button', { name: '载入示例文档', exact: true }).click();
  await expect(page.locator('.pdf-page')).toHaveCount(3);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator('.pdf-page-image img')).toHaveCount(3);
  await thumbnails(page);
  await page.screenshot({ path: resolve(screenshots, 'desktop.png'), fullPage: true });
  for (const [width, name] of [[390, 'mobile.png'], [310, 'user-310.png']]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: resolve(screenshots, name), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: '深色', exact: true }).click();
  await page.screenshot({ path: resolve(screenshots, 'dark-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: '浅色', exact: true }).click();
  await page.getByRole('button', { name: '预览第 1 页', exact: true }).click();
  await expect(page.locator('dialog img')).toBeVisible();
  await page.screenshot({ path: resolve(screenshots, 'preview.png'), fullPage: true });
});

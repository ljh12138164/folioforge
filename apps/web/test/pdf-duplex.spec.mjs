import { test, expect } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const shots = resolve('../../.impeccable/review/pdf-duplex');
async function scan(name, widths) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  widths.forEach(width => doc.addPage([width, 400]).drawText(`SYNTHETIC SCAN ${width}`, { x: 20, y: 200, font, size: 16 }));
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}
const add = (page, files) => page.getByLabel('导入 PDF 或图片', { exact: true }).setInputFiles(files);
const sequence = page => page.locator('.pdf-page p').allTextContents();
async function output(page, info) {
  await page.getByRole('button', { name: '生成 PDF', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: '下载结果', exact: true }).click();
  const download = await pending;
  const file = info.outputPath('duplex.pdf'); await download.saveAs(file);
  const doc = await PDFDocument.load(await readFile(file));
  return doc.getPages().map(p => p.getWidth());
}
async function capture(page, name) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: resolve(shots, name), fullPage: true, animations: 'disabled' });
}

test('single scan validates split, reorders true pages and supports undo/redo', async ({ page }, info) => {
  await page.goto('/pdf/?tool=duplex');
  await expect(page.getByRole('button', { name: '应用重排', exact: true })).toBeDisabled();
  await add(page, [await scan('combined.pdf', [201, 203, 205, 206, 204, 202])]);
  await expect(page.locator('.pdf-page')).toHaveCount(6);
  await expect(page.locator('.pdf-duplex-preview')).toContainText('1 → 6 → 2 → 5 → 3 → 4');
  const input = page.getByRole('spinbutton', { name: '正面页数', exact: true });
  for (const bad of ['0', '6', '1.5']) {
    await input.fill(bad);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('button', { name: '应用重排', exact: true })).toBeDisabled();
  }
  await input.fill('3');
  await page.getByRole('button', { name: '应用重排', exact: true }).click();
  await expect(page.locator('.pdf-applied')).toContainText('已重排正反页面');
  expect(await output(page, info)).toEqual([201, 202, 203, 204, 205, 206]);
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  expect(await output(page, info)).toEqual([201, 203, 205, 206, 204, 202]);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  expect(await output(page, info)).toEqual([201, 202, 203, 204, 205, 206]);
});

test('two scans keep all unequal pages, allow switching fronts and export offline', async ({ page, context }, info) => {
  await page.goto('/pdf/?tool=duplex');
  await expect(page.locator('.pdf-footer')).toContainText('离线资源已就绪', { timeout: 90_000 });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true); await page.reload();
  await add(page, [await scan('front.pdf', [201, 203, 205]), await scan('back.pdf', [204, 202])]);
  await expect(page.locator('.pdf-page')).toHaveCount(5);
  await page.getByRole('combobox', { name: '页面来源', exact: true }).selectOption('files');
  await expect(page.locator('.pdf-duplex-preview')).toContainText('多出的 1 页');
  await page.getByRole('combobox', { name: '正面文件', exact: true }).selectOption('second');
  await expect(page.locator('.pdf-duplex-preview')).toContainText('4 → 3 → 5 → 2 → 1');
  await page.getByRole('combobox', { name: '正面文件', exact: true }).selectOption('first');
  await page.getByRole('checkbox', { name: '反转背面顺序', exact: true }).uncheck();
  await expect(page.locator('.pdf-duplex-preview')).toContainText('1 → 4 → 2 → 5 → 3');
  await page.getByRole('checkbox', { name: '反转背面顺序', exact: true }).check();
  await page.getByRole('button', { name: '应用重排', exact: true }).click();
  expect(await sequence(page)).toEqual(['front.pdf', 'back.pdf', 'front.pdf', 'back.pdf', 'front.pdf']);
  expect(await output(page, info)).toEqual([201, 202, 203, 204, 205]);
  await context.setOffline(false);
  await add(page, [await scan('extra.pdf', [207])]);
  await expect(page.locator('.pdf-page')).toHaveCount(6);
  await expect(page.getByRole('button', { name: '应用重排', exact: true })).toBeDisabled();
  await expect(page.locator('.pdf-edit-tools [role=alert]')).toContainText('恰好两个来源文件');
});

test('directory and duplex visual states at desktop, mobile, narrow and dark', async ({ page }) => {
  await mkdir(shots, { recursive: true });
  await page.goto('/');
  await page.getByRole('searchbox', { name: '搜索工具', exact: true }).fill('双面');
  await page.getByRole('link', { name: /PDF 双面扫描重排/ }).click();
  await expect(page.getByRole('button', { name: '双面重排', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await capture(page, 'empty.png');
  await add(page, [await scan('正面扫描-合成示例.pdf', [201, 203, 205]), await scan('背面扫描-合成示例.pdf', [204, 202])]);
  await expect(page.locator('.pdf-page')).toHaveCount(5);
  await page.getByRole('combobox', { name: '页面来源', exact: true }).selectOption('files');
  await page.getByRole('button', { name: /^浅色(?:模式)?$/ }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator('.pdf-page-image img')).toHaveCount(5);
  await capture(page, 'desktop.png');
  for (const width of [390, 310]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(page, width === 390 ? 'mobile.png' : 'user-310.png');
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: /^深色(?:模式)?$/ }).click();
  await capture(page, 'dark.png');
  await page.getByRole('button', { name: '应用重排', exact: true }).click();
  await expect(page.locator('.pdf-applied')).toBeVisible();
  await capture(page, 'applied.png');
});

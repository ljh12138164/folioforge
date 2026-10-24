import { test, expect } from '@playwright/test';
import { PDFDocument, PDFName, PDFNumber, StandardFonts, degrees, rgb } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const shots = resolve('work/test-results/visual/pdf-complete');
const file = (name, bytes) => ({ name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) });
const add = (page, files) => page.getByLabel('导入 PDF 或图片', { exact: true }).setInputFiles(files);
async function output(page, info, name = 'result.pdf') {
  await page.getByRole('button', { name: '生成 PDF', exact: true }).click();
  const event = page.waitForEvent('download'); await page.getByRole('link', { name: '下载结果', exact: true }).click();
  const download = await event, path = info.outputPath(name); await download.saveAs(path); return new Uint8Array(await readFile(path));
}
async function scans() {
  const doc = await PDFDocument.create(), font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 6; i++) {
    const p = doc.addPage([300 + i * 10, 400]);
    if (i === 1) p.drawRectangle({ x: 0, y: 0, width: 310, height: 400, color: rgb(.94, .94, .94) });
    if (i === 2) p.drawText('KEEP THIS TEXT', { x: 20, y: 200, font, size: 15 });
    if (i === 3) p.drawRectangle({ x: 20, y: 15, width: 10, height: 5, color: rgb(0, 0, 0) });
    if (i === 4) p.drawRectangle({ x: 0, y: 0, width: 340, height: 400, color: rgb(0, 0, 0) });
    if (i === 5) p.drawRectangle({ x: 30, y: 40, width: 100, height: 100, color: rgb(.9, .7, .7) });
  }
  return doc.save();
}
async function rotations() {
  const doc = await PDFDocument.create();
  for (const angle of [0, 90, 180, 270]) {
    const p = doc.addPage([300, 420]); p.setMediaBox(10, 20, 300, 420); p.setCropBox(30, 40, 200, 300); p.setRotation(degrees(angle));
    p.node.set(PDFName.of('UserUnit'), PDFNumber.of(2)); p.drawText(`KEEP ${angle}`, { x: 70, y: 170, size: 12 });
  }
  return doc.save();
}
async function stamp(page) {
  const png = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 120; c.height = 40;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 120, 40);
    return Array.from(new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/png'))).arrayBuffer()));
  });
  await page.getByRole('combobox', { name: '签名或图片来源', exact: true }).selectOption('upload');
  await page.getByLabel('选择签名或 Logo', { exact: true }).setInputFiles({ name: 'synthetic-mark.png', mimeType: 'image/png', buffer: Buffer.from(png) });
  await expect(page.getByAltText('待应用的签名或图片', { exact: true })).toBeVisible();
}
async function capture(page, name) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: resolve(shots, name), fullPage: true, animations: 'disabled' });
}

test('blank scan detection protects text/marks/dark sheets and requires explicit deletion', async ({ page }, info) => {
  await page.goto('/pdf/?tool=blank'); await add(page, [file('scan-synthetic.pdf', await scans())]);
  await expect(page.locator('.pdf-page')).toHaveCount(6);
  await page.getByRole('button', { name: '检测 6 页', exact: true }).click();
  await expect(page.locator('.pdf-blank-result')).toHaveCount(2);
  await expect(page.locator('.pdf-page')).toHaveCount(6);
  await expect(page.getByRole('button', { name: '删除勾选的候选页', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '预览空白候选第 2 页', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible(); await page.getByRole('button', { name: '关闭页面预览', exact: true }).click();
  await page.getByRole('combobox', { name: '检测灵敏度', exact: true }).selectOption('0.1');
  await expect(page.locator('.pdf-blank-result')).toHaveCount(0);
  await page.getByRole('button', { name: '检测 6 页', exact: true }).click();
  await expect(page.locator('.pdf-blank-result')).toHaveCount(3);
  await page.getByRole('combobox', { name: '检测灵敏度', exact: true }).selectOption('0.025');
  await page.getByRole('button', { name: '检测 6 页', exact: true }).click();
  await page.getByRole('checkbox', { name: '候选第 1 页', exact: true }).check();
  await page.getByRole('button', { name: '删除勾选的候选页', exact: true }).click();
  await expect(page.locator('.pdf-page')).toHaveCount(5); await expect(page.locator('.pdf-blank-result')).toHaveCount(0);
  const pdf = await PDFDocument.load(await output(page, info)); expect(pdf.getPages().map(p => p.getWidth())).toEqual([310, 320, 330, 340, 350]);
  await page.getByRole('button', { name: '撤销', exact: true }).click(); await expect(page.locator('.pdf-page')).toHaveCount(6);
});

test('image signatures land at real visible coordinates for all rotations and UserUnit', async ({ page }, info) => {
  await page.goto('/pdf/?tool=stamp'); await add(page, [file('rotations.pdf', await rotations())]);
  await stamp(page);
  for (const [name, value] of [['横向位置', 80], ['纵向位置', 80], ['图片宽度', 30]]) {
    const range = page.getByRole('slider', { name: new RegExp(`^${name}`) });
    await range.fill(String(value));
  }
  await page.getByRole('button', { name: '应用到 4 页', exact: true }).click();
  await expect(page.locator('.pdf-applied')).toBeVisible();
  // Thumbnails load only near the viewport; applying the stamp may scroll them out of view.
  for (let index = 0; index < 4; index++) {
    const preview = page.locator('.pdf-page-image').nth(index);
    await preview.scrollIntoViewIfNeeded();
    await expect.poll(() => preview.locator('img').evaluateAll(imgs => imgs.length === 1 && imgs[0].complete && imgs[0].naturalWidth > 0)).toBe(true);
  }
  const positions = await page.locator('.pdf-page-image img').evaluateAll(imgs => imgs.map(img => {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, c.width, c.height).data; let n = 0, x = 0, y = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 220 && pixels[i + 1] < 60 && pixels[i + 2] < 60) { n++; x += i / 4 % c.width; y += Math.floor(i / 4 / c.width); }
    return { x: x / n / c.width, y: y / n / c.height, n };
  }));
  for (const p of positions) { expect(p.n).toBeGreaterThan(100); expect(p.x).toBeCloseTo(.8, 1); expect(p.y).toBeCloseTo(.8, 1); }
  const bytes = await output(page, info), doc = await PDFDocument.load(bytes);
  expect(doc.getPages().map(p => p.getRotation().angle)).toEqual([0, 90, 180, 270]);
  const extracted = await getDocument({ data: bytes.slice(), standardFontDataUrl: resolve('node_modules/pdfjs-dist/standard_fonts').replaceAll('\\', '/') + '/' }).promise;
  expect((await (await extracted.getPage(1)).getTextContent()).items.map(i => i.str || '').join('')).toContain('KEEP'); await extracted.loadingTask.destroy();
  await page.getByRole('button', { name: '撤销', exact: true }).click(); await expect(page.locator('.pdf-applied')).toHaveCount(0);
  const restored = await PDFDocument.load(await output(page, info, 'undo.pdf'));
  expect(restored.getPage(0).node.Resources()?.lookup(PDFName.of('XObject'))?.keys().length ?? 0).toBe(0);
});

test('handwriting, pointer positioning, clear and invalid upload are usable', async ({ page }) => {
  await page.goto('/pdf/?tool=stamp'); await add(page, [file('scan.pdf', await scans())]);
  // The async positioning preview changes the settings column's scroll geometry.
  await expect.poll(() => page.getByAltText('当前页面定位预览', { exact: true }).evaluateAll(imgs => imgs.length === 1 && imgs[0].complete && imgs[0].naturalWidth > 0)).toBe(true);
  const pad = page.getByLabel('手写签名区域', { exact: true }); await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  await page.mouse.move(box.x + 20, box.y + 20); await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + 35, { steps: 10 }); await page.mouse.move(box.x + 150, box.y + 15, { steps: 10 }); await page.mouse.up();
  await expect(page.getByAltText('待应用的签名或图片', { exact: true })).toBeVisible();
  const placement = page.getByLabel('签名位置预览', { exact: true }); await placement.click({ position: { x: 60, y: 100 } });
  await expect(page.getByRole('slider', { name: /^横向位置/ })).not.toHaveValue('75');
  await page.getByRole('button', { name: '应用到 6 页', exact: true }).click(); await expect(page.locator('.pdf-applied')).toBeVisible();
  await page.getByRole('button', { name: '清空签名', exact: true }).click(); await expect(page.getByRole('button', { name: '应用到 6 页', exact: true })).toBeDisabled();
  await page.getByRole('combobox', { name: '签名或图片来源', exact: true }).selectOption('upload');
  await page.getByLabel('选择签名或 Logo', { exact: true }).setInputFiles({ name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('bad') });
  await expect(page.locator('.pdf-stamp-tools [role=alert]')).toContainText('有效的 PNG');
});

test('visual compare synchronizes pages, sizes, sliders, modes and missing sides', async ({ page }) => {
  await page.goto('/pdf/?tool=compare'); await add(page, [file('old.pdf', await rotations()), file('new.pdf', await scans())]);
  await expect(page.locator('.pdf-compare-stage img')).toHaveCount(2);
  const sizes = await page.locator('.pdf-compare-stage img').evaluateAll(imgs => imgs.map(img => [img.naturalWidth, img.naturalHeight]));
  expect(sizes[0]).toEqual(sizes[1]);
  await page.getByRole('slider', { name: /^分界位置/ }).fill('25');
  await expect(page.locator('.pdf-compare-stage img').nth(1)).toHaveCSS('clip-path', 'inset(0px 0px 0px 25%)');
  await page.getByRole('combobox', { name: '对比方式', exact: true }).selectOption('overlay');
  await page.getByRole('slider', { name: /^右侧叠加不透明度/ }).fill('70');
  await expect(page.locator('.pdf-compare-stage img').nth(1)).toHaveCSS('opacity', '0.7');
  await page.getByRole('combobox', { name: '对比方式', exact: true }).selectOption('side'); await expect(page.locator('.pdf-compare-side img')).toHaveCount(2);
  await page.getByRole('combobox', { name: '对比页码', exact: true }).selectOption('5'); await expect(page.locator('.pdf-compare-missing')).toContainText('左侧文件没有第 6 页');
  await page.getByRole('combobox', { name: '右侧文件', exact: true }).selectOption({ label: 'old.pdf' });
  await expect(page.getByRole('heading', { name: '请选择两个不同来源', exact: true })).toBeVisible();
});

test('cold offline first use covers blank detection, signature export and comparison', async ({ page, context }, info) => {
  const external = []; page.on('request', req => { if (!req.url().startsWith('blob:') && new URL(req.url()).origin !== 'http://127.0.0.1:43188') external.push(req.url()); });
  await page.goto('/pdf/?tool=blank'); await expect(page.locator('.pdf-footer')).toContainText('离线资源已就绪', { timeout: 90_000 });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller); await context.setOffline(true); await page.reload();
  await add(page, [file('scan.pdf', await scans())]); await page.getByRole('button', { name: '检测 6 页', exact: true }).click(); await expect(page.locator('.pdf-blank-result')).toHaveCount(2);
  await page.getByRole('button', { name: '签名与图片', exact: true }).click(); await stamp(page);
  await page.getByRole('button', { name: '应用到 6 页', exact: true }).click(); await expect(page.locator('.pdf-applied')).toBeVisible();
  expect((await PDFDocument.load(await output(page, info))).getPageCount()).toBe(6);
  await add(page, [file('other.pdf', await rotations())]); await page.getByRole('button', { name: '视觉对比', exact: true }).click();
  await expect(page.locator('.pdf-compare-stage img')).toHaveCount(2); expect(external).toEqual([]); await context.setOffline(false);
});

test('final features visual matrix at desktop, mobile, narrow and dark', async ({ page }) => {
  await mkdir(shots, { recursive: true }); await page.goto('/pdf/?tool=blank');
  await add(page, [file('空白检测-合成扫描.pdf', await scans())]); await page.getByRole('button', { name: '检测 6 页', exact: true }).click(); await expect(page.locator('.pdf-blank-result')).toHaveCount(2);
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.getByRole('button', { name: /^浅色(?:模式)?$/ }).click(); await capture(page, 'blank-desktop.png');
  await page.getByRole('button', { name: '签名与图片', exact: true }).click(); await stamp(page); await expect(page.getByAltText('当前页面定位预览', { exact: true })).toBeVisible(); await capture(page, 'stamp-desktop.png');
  for (const width of [390, 310]) { await page.setViewportSize({ width, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await capture(page, width === 390 ? 'mobile.png' : 'user-310.png'); }
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.getByRole('button', { name: /^深色(?:模式)?$/ }).click(); await capture(page, 'stamp-dark.png');
  await page.getByRole('button', { name: /^浅色(?:模式)?$/ }).click();
  await add(page, [file('对比版本-合成示例.pdf', await rotations())]); await page.getByRole('button', { name: '视觉对比', exact: true }).click();
  await page.getByRole('combobox', { name: '对比页码', exact: true }).selectOption('2');
  await expect(page.locator('.pdf-compare-stage img')).toHaveCount(2); await capture(page, 'compare-desktop.png');
  await page.getByRole('combobox', { name: '对比方式', exact: true }).selectOption('overlay'); await capture(page, 'compare-overlay.png');
  await page.getByRole('combobox', { name: '对比方式', exact: true }).selectOption('side'); await capture(page, 'compare-side.png');
  await page.setViewportSize({ width: 310, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await capture(page, 'compare-310.png');
});

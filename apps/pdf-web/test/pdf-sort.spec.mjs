import { test, expect } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'node:fs/promises';

for (const reducedMotion of ['no-preference', 'reduce']) {
  test(`PDF sorting animates across rows and preserves undo/export (${reducedMotion})`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/pdf/');
    if (reducedMotion === 'no-preference') await page.getByRole('button', { name: '深色', exact: true }).click();
    const doc = await PDFDocument.create();
    for (let i = 0; i < 6; i++) doc.addPage([210 + i * 10, 310]);
    await page.getByLabel('导入 PDF 或图片', { exact: true }).setInputFiles({ name: 'sort.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) });
    const cards = page.locator('.pdf-page:not([data-dnd-placeholder])');
    await expect(cards).toHaveCount(6);
    const order = () => cards.evaluateAll(items => items.map(item => item.dataset.pageId));
    const original = await order();
    await page.evaluate(() => {
      window.sortAnimations = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (frames, options) {
        if (this.matches('.pdf-page')) window.sortAnimations.push({ frames, duration: options.duration });
        return animate.call(this, frames, options);
      };
    });

    const moved = [...original.slice(1), original[0]];
    const dragAcrossRows = async () => {
      const start = await page.getByRole('button', { name: '拖动第 1 页排序', exact: true }).boundingBox();
      const slot = await cards.first().boundingBox();
      const end = await page.locator(`[data-page-id="${original[5]}"]`).boundingBox();
      expect(end.y).toBeGreaterThan(start.y);
      await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
      await page.mouse.down();
      await page.mouse.move(start.x + start.width / 2 + 12, start.y + start.height / 2, { steps: 3 });
      await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 15 });
      // The pointer is still held: neighbours must already have moved out of the way.
      await expect.poll(order).toEqual(moved);
      await expect(page.locator(`[data-page-id="${original[0]}"]:not([data-dnd-placeholder])`)).toHaveClass(/is-dragging/);
      await expect.poll(async () => {
        const neighbour = await page.locator(`[data-page-id="${original[1]}"]`).boundingBox();
        return Math.abs(neighbour.x - slot.x) + Math.abs(neighbour.y - slot.y);
      }).toBeLessThan(2);
    };
    await dragAcrossRows();
    await page.screenshot({ path: testInfo.outputPath(`sort-hover-${reducedMotion}.png`), fullPage: true });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0);
    await expect.poll(order).toEqual(original);

    await dragAcrossRows();
    await page.mouse.up();
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0);
    await expect.poll(order).toEqual(moved);
    const animations = await page.evaluate(() => window.sortAnimations);
    if (reducedMotion === 'reduce') expect(animations.filter(animation => animation.duration > 0)).toHaveLength(0);
    else expect(animations.some(animation => animation.duration === 240)).toBe(true);
    await page.getByRole('button', { name: '撤销', exact: true }).click();
    await expect.poll(order).toEqual(original);
    await page.getByRole('button', { name: '重做', exact: true }).click();
    await expect.poll(order).toEqual(moved);
    await page.getByRole('button', { name: '生成 PDF', exact: true }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('link', { name: '下载结果', exact: true }).click();
    const file = await download;
    const exported = await PDFDocument.load(await readFile(await file.path()));
    expect(exported.getPages().map(item => item.getWidth())).toEqual([220, 230, 240, 250, 260, 210]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: '前移第 6 页', exact: true }).click();
    await expect.poll(order).toEqual([...original.slice(1, 5), original[0], original[5]]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await cards.evaluateAll(items => Promise.all(items.flatMap(item => item.getAnimations().map(animation => animation.finished.catch(() => {})))));
    await page.screenshot({ path: testInfo.outputPath(`sort-mobile-${reducedMotion}.png`), fullPage: true });
  });
}

test('PDF sort handle supports keyboard sorting and cancellation', async ({ page }) => {
  await page.goto('/pdf/');
  await page.getByRole('button', { name: '载入示例文档', exact: true }).click();
  const cards = page.locator('.pdf-page:not([data-dnd-placeholder])');
  await expect(cards).toHaveCount(3);
  const order = () => cards.evaluateAll(items => items.map(item => item.dataset.pageId));
  const original = await order();
  await page.getByRole('button', { name: '拖动第 1 页排序', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-dnd-dragging]')).toHaveCount(1);
  await page.keyboard.press('ArrowRight');
  await expect.poll(order).toEqual([original[1], original[0], original[2]]);
  await page.keyboard.press('Escape');
  await expect.poll(order).toEqual(original);
  await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0);
  await page.getByRole('button', { name: '拖动第 1 页排序', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-dnd-dragging]')).toHaveCount(1);
  await page.keyboard.press('ArrowRight');
  await expect.poll(order).toEqual([original[1], original[0], original[2]]);
  await page.keyboard.press('Space');
  await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0);
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect.poll(order).toEqual(original);
  await page.getByRole('button', { name: '预览第 1 页', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('PDF pages sort under a held touch pointer', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:43190/pdf/');
    await page.getByRole('button', { name: '载入示例文档', exact: true }).click();
    const cards = page.locator('.pdf-page:not([data-dnd-placeholder])');
    await expect(cards).toHaveCount(3);
    const order = () => cards.evaluateAll(items => items.map(item => item.dataset.pageId));
    const original = await order();
    const handle = page.getByRole('button', { name: '拖动第 1 页排序', exact: true });
    await handle.scrollIntoViewIfNeeded();
    const start = await handle.boundingBox(), end = await cards.nth(1).boundingBox();
    const session = await context.newCDPSession(page);
    const from = { x: start.x + start.width / 2, y: start.y + start.height / 2 };
    const to = { x: end.x + end.width / 2, y: end.y + 30 };
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...from, id: 1 }] });
    await page.waitForTimeout(300); // Hold long enough to activate the touch sensor.
    for (let i = 1; i <= 12; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + (to.x - from.x) * i / 12, y: from.y + (to.y - from.y) * i / 12, id: 1 }] });
    await expect.poll(order).toEqual([original[1], original[0], original[2]]);
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(1);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.locator('[data-dnd-dragging]')).toHaveCount(0);
    await page.getByRole('button', { name: '撤销', exact: true }).click();
    await expect.poll(order).toEqual(original);
  } finally {
    await context.close();
  }
});

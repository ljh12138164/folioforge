import { test, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const captures = resolve('work/test-results/visual/image-compare');
const sample = await readFile(resolve('public/sample-landscape.png'));
const originalWidth = sample.readUInt32BE(16), originalHeight = sample.readUInt32BE(20);
async function convert(page) {
  await page.goto('/convert/?format=JPEG&quality=12&maxWidth=800');
  await page.getByRole('button', { name: /试试这张示例/ }).click();
  await expect(page.locator('.convert-button')).toBeEnabled();
  await page.locator('.convert-button').click();
  await expect(page.getByRole('region', { name: '图片转换前后对照' })).toBeVisible();
  await expect.poll(() => page.locator('.image-compare-layer img').evaluateAll(images => images.length === 2 && images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
}
const geometry = page => page.locator('.image-compare-layer img').evaluateAll(images => images.map(image => ({ width: image.width, height: image.height, left: image.style.left, top: image.style.top })));

test('import and setting changes automatically preview real encoded bytes and sizes', async ({ page }) => {
  await page.goto('/convert/?format=JPEG&quality=12&maxWidth=800');
  await page.getByRole('button', { name: /试试这张示例/ }).click();
  await expect(page.getByRole('region', { name: '图片转换前后对照' })).toBeVisible();
  const result = page.getByAltText('实际转换结果');
  await expect(result).toBeVisible({ timeout: 30_000 });
  const original = page.locator('.image-compare-sizes>div').first();
  const converted = page.locator('.image-compare-sizes>div').last();
  await expect(original).toContainText('PNG');
  await expect(converted).toContainText('JPG');
  const firstUrl = await result.getAttribute('src');
  const byteSize = await result.evaluate(async image => (await (await fetch(image.src)).blob()).size);
  await expect(converted.locator('strong')).toHaveText(`${(byteSize / 1024).toFixed(1)} KB`);
  await expect(page.locator('.file-row .status')).toHaveText('等待转换');
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: '下载 JPG', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('示例-山景.jpg');
  expect((await readFile(await file.path())).length).toBe(byteSize);

  // Rapid changes must discard an older conversion rather than label it with new settings.
  await page.locator('#quality').fill('90');
  await page.getByLabel('最大宽度', { exact: true }).fill('600');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  await expect(converted).toContainText('转换后 · PNG');
  await expect(converted).toContainText(`600 × ${Math.round(originalHeight * 600 / originalWidth)}`, { timeout: 30_000 });
  await expect(result).not.toHaveAttribute('src', firstUrl);
  const encoded = await result.evaluate(async image => {
    await image.decode();
    const blob = await (await fetch(image.src)).blob();
    return { size: blob.size, type: blob.type, width: image.naturalWidth };
  });
  expect(encoded.type).toBe('image/png');
  expect(encoded.width).toBe(600);
  const formatted = encoded.size >= 1024 * 1024 ? `${(encoded.size / 1024 / 1024).toFixed(2)} MB` : `${(encoded.size / 1024).toFixed(1)} KB`;
  await expect(converted.locator('strong')).toHaveText(formatted);
  await expect(page.locator('.file-row .status')).toHaveText('等待转换');
  await mkdir(captures, { recursive: true });
  await page.screenshot({ path: resolve(captures, 'automatic-preview.png'), fullPage: true });
});

test('actual input/output pixels share zoom and pan, keyboard split, resize and fullscreen', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await convert(page);
  await expect(page.getByText(/减少 [\d.]+%/).first()).toBeVisible();
  await expect(page.locator('.image-compare-sizes').getByText(`800 × ${Math.round(originalHeight * 800 / originalWidth)}`)).toBeVisible();
  const images = await page.locator('.image-compare-layer img').evaluateAll(images => images.map(image => ({ width: image.naturalWidth, src: image.src })));
  expect(images[0].width).toBe(originalWidth);
  expect(images[1].width).toBe(800);
  expect(images[0].src).not.toBe(images[1].src);
  await page.getByRole('button', { name: '100%', exact: true }).click();
  await expect(page.getByLabel('对照缩放比例')).toHaveText('100%');
  let pair = await geometry(page); expect(pair[0]).toEqual(pair[1]); expect(pair[0].width).toBe(originalWidth);
  const stage = page.locator('.image-compare-stage'), box = await stage.boundingBox();
  await page.mouse.move(box.x + box.width * .25, box.y + box.height * .55);
  await page.mouse.down(); await page.mouse.move(box.x + box.width * .25 + 70, box.y + box.height * .55 + 30); await page.mouse.up();
  pair = await geometry(page); expect(pair[0]).toEqual(pair[1]); expect(pair[0].left).not.toBe('calc(50% + 0px)');
  await stage.dispatchEvent('wheel', { ctrlKey: true, deltaY: -100, clientX: box.x + box.width * .25, clientY: box.y + box.height * .55 });
  await expect(page.getByLabel('对照缩放比例')).toHaveText('120%');
  pair = await geometry(page); expect(pair[0]).toEqual(pair[1]);
  const slider = page.getByRole('slider', { name: '拖动以对比转换前后图片' });
  await slider.focus(); await slider.press('Home'); await expect(slider).toHaveAttribute('aria-valuenow', '0');
  await slider.press('End'); await expect(slider).toHaveAttribute('aria-valuenow', '100');
  await slider.press('ArrowLeft'); await expect(slider).toHaveAttribute('aria-valuenow', '99');
  await slider.press('Shift+ArrowLeft'); await expect(slider).toHaveAttribute('aria-valuenow', '89');
  await slider.press('Home'); for (let n = 0; n < 5; n++) await slider.press('Shift+ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '50');
  await page.getByRole('button', { name: '适应', exact: true }).click();
  pair = await geometry(page); expect(pair[0]).toEqual(pair[1]); expect(pair[0].width).toBeLessThanOrEqual(box.width + 1);
  await page.getByRole('button', { name: '全屏对照', exact: true }).click();
  await expect(page.getByRole('button', { name: '退出全屏对照', exact: true })).toBeVisible();
  await mkdir(captures, { recursive: true });
  await page.screenshot({ path: resolve(captures, 'fullscreen.png') });
  await page.getByRole('button', { name: '退出全屏对照', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: resolve(captures, 'desktop.png'), fullPage: true });
  await page.getByRole('button', { name: '100%', exact: true }).click();
  await page.screenshot({ path: resolve(captures, 'detail-100.png'), fullPage: true });
  await page.getByRole('button', { name: '适应', exact: true }).click();
  for (const width of [390, 310]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: resolve(captures, `${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: '深色', exact: true }).click();
  await page.screenshot({ path: resolve(captures, 'dark.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('cancelled pointer gestures recover, unsupported image formats use honest previews, and new results reset the view', async ({ page }) => {
  await convert(page);
  const slider = page.getByRole('slider', { name: '拖动以对比转换前后图片' });
  const handle = await slider.boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2); await page.mouse.down();
  await slider.dispatchEvent('pointercancel', { pointerId: 1 }); await page.mouse.up();
  await expect(page.locator('.image-compare-stage')).not.toHaveClass(/is-dragging/);
  for (const interruption of ['blur', 'lostpointercapture']) {
    const current = await slider.boundingBox();
    await page.mouse.move(current.x + current.width / 2, current.y + current.height / 2); await page.mouse.down();
    if (interruption === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    else await slider.dispatchEvent('lostpointercapture', { pointerId: 1 });
    await page.mouse.up();
    await expect(page.locator('.image-compare-stage')).not.toHaveClass(/is-dragging/);
  }
  const box = await page.locator('.image-compare-stage').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .7, box.y + box.height / 2); await page.mouse.up();
  await page.getByRole('button', { name: '100%', exact: true }).click();
  await page.getByRole('button', { name: '更多格式', exact: true }).click();
  await page.getByRole('button', { name: 'QOI', exact: true }).click();
  await page.locator('.convert-button').click();
  await expect(page.getByText(/当前格式使用引擎缩略预览/)).toBeVisible();
  await expect.poll(() => page.locator('.image-compare-layer img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(page.getByRole('button', { name: '适应', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(slider).toHaveAttribute('aria-valuenow', '50');
  const pair = await geometry(page); expect(pair[0]).toEqual(pair[1]);
  await page.getByRole('button', { name: '适应', exact: true }).click();
  await page.screenshot({ path: resolve(captures, 'fallback.png'), fullPage: true });
});

import { test, expect } from '@playwright/test';

test('dragging a workbench image never imports it again; external file drops still work', async ({ page }) => {
  await page.goto('/convert/');
  await page.getByRole('button', { name: /试试这张示例/ }).click();
  await expect(page.getByAltText('实际转换结果')).toBeVisible({ timeout: 30_000 });
  const source = page.getByAltText('转换前的原图');
  await expect.poll(() => source.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  const box = await source.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  try {
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 50, { steps: 10 });
    await expect(page.locator('.drag-overlay')).toHaveCount(0, { timeout: 2000 });
  } finally { await page.mouse.up(); }
  await expect(page.locator('.file-row')).toHaveCount(1);

  const text = await page.evaluateHandle(() => {
    const transfer = new DataTransfer(); transfer.setData('text/plain', 'example'); return transfer;
  });
  await page.locator('.app-shell').dispatchEvent('dragover', { dataTransfer: text });
  await expect(page.locator('.drag-overlay')).toHaveCount(0);
  await page.locator('.app-shell').dispatchEvent('drop', { dataTransfer: text });
  await expect(page.locator('.file-row')).toHaveCount(1);
  await text.dispose();

  const files = await page.evaluateHandle(() => {
    const transfer = new DataTransfer();
    for (const name of ['external-one.svg', 'external-two.svg']) transfer.items.add(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>'], name, { type: 'image/svg+xml' }));
    return transfer;
  });
  await page.locator('.app-shell').dispatchEvent('dragover', { dataTransfer: files });
  await expect(page.locator('.drag-overlay')).toBeVisible();
  await page.locator('.app-shell').dispatchEvent('drop', { dataTransfer: files });
  await expect(page.locator('.drag-overlay')).toHaveCount(0);
  await expect(page.locator('.file-row')).toHaveCount(3);
  await expect(page.getByRole('button', { name: '预览 external-one.svg', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '预览 external-two.svg', exact: true })).toBeVisible();
  await files.dispose();
});

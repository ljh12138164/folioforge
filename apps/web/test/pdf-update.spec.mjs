import { test, expect } from '@playwright/test';

test('online reload uses the current PDF page while offline reload retains its cached copy', async ({ page, context }) => {
  await page.goto('/pdf/');
  await expect(page.getByText('离线资源已就绪', { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    const name = (await caches.keys()).find(key => key.startsWith('pixelforge-pdf-'));
    const cache = await caches.open(name);
    await cache.put('/pdf/', new Response('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><h1>缓存旧页面</h1></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
  });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('把每一页');
  await expect(page.getByRole('button', { name: '扫描件 OCR', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '压缩 PDF', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('缓存旧页面');
});

import { test, expect } from '@playwright/test';

async function prepare(page, memory = 8, failure = '', overlap = false) {
  await page.addInitScript(({ memory, failure, overlap }) => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 });
    Object.defineProperty(navigator, 'deviceMemory', { value: memory });
    window.__work = { active: 0, peak: 0, starts: [], errors: 0, live: 0, perWidth: {} };
    const NativeWorker = Worker;
    const initialPair = [];
    window.Worker = class extends NativeWorker {
      pending = new Set();
      ended = false;
      constructor(...args) {
        super(...args);
        window.__work.live++;
        this.addEventListener('message', ({ data }) => {
          if (this.pending.delete(data.id)) window.__work.active--;
        });
        this.addEventListener('error', () => { window.__work.active -= this.pending.size; this.pending.clear(); });
      }
      postMessage(data, ...rest) {
        if (data.options) {
          const width = new DataView(data.bytes).getUint32(16);
          const stats = window.__work;
          stats.active++;
          stats.peak = Math.max(stats.peak, stats.active);
          stats.starts.push({ width, active: stats.active });
          stats.perWidth[width] = (stats.perWidth[width] ?? 0) + 1;
          this.pending.add(data.id);
          if (width === 160 && failure && (failure === 'always' || stats.errors === 0)) {
            stats.errors++;
            queueMicrotask(() => this.dispatchEvent(failure === 'crash' ? new ErrorEvent('error') : new MessageEvent('message', { data: { type: 'error', id: data.id, error: '浏览器内存不足，请减小图片尺寸或分批处理。' } })));
            return;
          }
          // Start both real conversions together after their WASM workers are ready.
          if (overlap && [1600, 1601].includes(width)) {
            initialPair.push(() => super.postMessage(data, ...rest));
            if (initialPair.length === 2) initialPair.splice(0).forEach(send => send());
            return;
          }
        }
        return super.postMessage(data, ...rest);
      }
      terminate() {
        if (!this.ended) {
          this.ended = true;
          window.__work.live--;
          window.__work.active -= this.pending.size;
          this.pending.clear();
        }
        super.terminate();
      }
    };
  }, { memory, failure, overlap });
  await page.goto('/convert/?format=JPEG');
  await expect(page.locator('footer')).toContainText('引擎就绪');
  await expect(page.getByRole('checkbox', { name: '保存任务到此设备' })).toBeEnabled();
}

async function add(page, sizes) {
  await page.evaluate(async (sizes) => {
    const files = new DataTransfer();
    for (const [index, [width, height]] of sizes.entries()) {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#136d8c'); gradient.addColorStop(1, '#edb152');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve));
      files.items.add(new File([blob], `parallel-${index}.png`, { type: 'image/png' }));
      canvas.width = canvas.height = 0;
    }
    const input = document.querySelector('input[type=file]'); input.files = files.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, sizes);
  await expect(page.locator('.file-row')).toHaveCount(sizes.length);
}

test('real conversions overlap, large images run alone, and idle engines are released', async ({ page }, testInfo) => {
  await prepare(page, 8, '', true);
  await add(page, [[1600, 1200], [1601, 1200], [1602, 1200], [1603, 1200], [4000, 2400], [1604, 1200], [1605, 1200]]);
  await page.locator('.convert-button').click();
  await expect(page.locator('.status-done')).toHaveCount(7, { timeout: process.env.CI ? 120_000 : 60_000 });
  await expect(page.locator('.convert-button')).toBeEnabled();
  const stats = await page.evaluate(() => window.__work);
  expect(stats.peak).toBe(2);
  expect(stats.starts.find((job) => job.width === 4000).active).toBe(1);
  expect(stats.live).toBe(1);
  await expect(page.locator('.file-info strong')).toHaveText(Array.from({ length: 7 }, (_, index) => `parallel-${index}.png`));
  await page.screenshot({ path: testInfo.outputPath('parallel-results.png'), fullPage: true });
});

test('low memory devices keep one conversion active', async ({ page }) => {
  await prepare(page, 4);
  await add(page, [[640, 480], [641, 480], [642, 480]]);
  await page.locator('.convert-button').click();
  await expect(page.locator('.status-done')).toHaveCount(3);
  expect(await page.evaluate(() => window.__work.peak)).toBe(1);
});

for (const failure of ['once', 'always', 'crash']) {
  test(`memory failure ${failure}: drains active work and retries the affected image only once`, async ({ page }) => {
    await prepare(page, 8, failure);
    await add(page, [[160, 120], [161, 120], [162, 120], [163, 120]]);
    await page.locator('.convert-button').click();
    await expect(page.locator('.convert-button')).toBeEnabled();
    const stats = await page.evaluate(() => window.__work);
    expect(stats.perWidth).toEqual({ 160: 2, 161: 1, 162: 1, 163: 1 });
    await expect(page.locator('.status-done')).toHaveCount(failure === 'always' ? 3 : 4);
    await expect(page.locator('.status-error')).toHaveCount(failure === 'always' ? 1 : 0);
    expect(stats.active).toBe(0);
    expect(stats.live).toBe(1);
  });
}

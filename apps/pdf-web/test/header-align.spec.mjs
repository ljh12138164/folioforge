import { test, expect } from '@playwright/test';

test('guide header text aligns with the main links at desktop and zoomed widths', async ({ page }, testInfo) => {
  for (const width of [1320, 960, 768, 767, 760, 390, 310]) {
    await page.emulateMedia({ colorScheme: width === 1320 ? 'light' : 'dark' });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/guide/');
    const metrics = await page.evaluate(() => {
      const textBox = selector => {
        const node = document.querySelector(selector);
        const range = document.createRange(); range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        return { center: rect.y + rect.height / 2, x: rect.x, y: rect.y };
      };
      const main = document.querySelector('main').getBoundingClientRect();
      return { help: textBox('.nav-aux a'), route: textBox('.nav-routes a'), mainLeft: main.x, mainRight: main.right, padding: parseFloat(getComputedStyle(document.querySelector('main')).paddingLeft), scrollWidth: document.documentElement.scrollWidth, width: innerWidth };
    });
    expect(metrics.mainLeft + metrics.padding).toBeGreaterThanOrEqual(14);
    expect(metrics.mainRight).toBeLessThanOrEqual(width);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(width);
    if (width > 760) expect(Math.abs(metrics.help.center - metrics.route.center)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`guide-${width}.png`) });
  }
});

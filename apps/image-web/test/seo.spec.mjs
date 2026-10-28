import { test, expect } from '@playwright/test';

const origin = 'https://img.ljhboard.cn';
const local = 'http://127.0.0.1:43188';
const paths = ['/', '/convert/', '/images/', '/guide/'];

test('image application has its own home and excludes PDF resources', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('.brand')).toContainText('PixelForge');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('图片格式转换');
  await expect(page.locator('a[href^="/pdf/"]')).toHaveCount(0);
  for (const path of ['/pdf/', '/pdf-sw.js', '/pdf-assets/pdf.worker.min.mjs']) expect((await request.get(path)).status()).toBe(404);
});

test('all public pages expose unique metadata and structured content without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const titles = new Set();
  try {
    for (const path of paths) {
      expect((await page.goto(local + path)).status()).toBe(200);
      titles.add(await page.title());
      await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /本地|本机/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', origin + path);
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', origin + path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
      const schema = await page.locator('script[type="application/ld+json"]').textContent();
      const graph = JSON.parse(schema)['@graph'];
      expect(graph.find(item => item['@type'] === 'WebPage').url).toBe(origin + path);
      if (path === '/pdf/' || path === '/convert/') expect(graph.some(item => item['@type'] === 'WebApplication')).toBe(true);
      await expect(page.locator('main')).toContainText(/图片/);
    }
    expect(titles.size).toBe(paths.length);
  } finally { await context.close(); }
});

test('crawler resources and share assets resolve to canonical production URLs', async ({ request, page }) => {
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Sitemap: ' + origin + '/sitemap.xml');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  const locations = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  expect(locations).toEqual(paths.map(path => origin + path));
  const llms = await request.get('/llms.txt');
  expect(llms.headers()['content-type']).toContain('text/plain');
  expect(await llms.text()).toContain(origin + '/guide/');
  expect(await llms.text()).toContain('SVG 描摹最多 400 万像素');
  for (const path of ['/favicon.svg', '/social-card.png']) expect((await request.get(path)).status()).toBe(200);
  await page.goto('/guide/');
  expect(await page.evaluate(() => new Promise(resolve => {
    const image = new Image(); image.onload = () => resolve([image.naturalWidth, image.naturalHeight]); image.src = '/social-card.png';
  }))).toEqual([1200, 630]);
  for (const path of ['/convert/?format=SVG&maxWidth=640']) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', origin + path.split('?')[0]);
  }
});

test('guide links work and remain readable at mobile widths in both themes', async ({ page, request }, testInfo) => {
  await page.goto('/guide/');
  const links = await page.locator('main a').evaluateAll(anchors => [...new Set(anchors.map(a => a.getAttribute('href')).filter(href => href.startsWith('/')))]);
  for (const href of links) expect((await request.get(href)).status()).toBe(200);
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 310, height: 844 });
    await page.goto('/guide/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`guide-${theme}-mobile.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 1320, height: 1000 });
  await page.screenshot({ path: testInfo.outputPath('guide-desktop.png'), fullPage: true });
});

test('local previews never load Umami', async ({ page }) => {
  const requests = [];
  page.on('request', request => { if (request.url().includes('analytics.ljhboard.cn')) requests.push(request.url()); });
  await page.goto('/guide/');
  await page.getByRole('button', { name: '深色', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(requests).toEqual([]);
  await expect(page.locator('#umami-analytics')).toHaveCount(0);
});

for (const blocked of [false, true]) test(`production loads configured Umami without blocking the tools (blocked=${blocked})`, async ({ browser, request }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  let scriptRequests = 0;
  await context.route(origin + '/**', async route => {
    const url = new URL(route.request().url());
    const response = await request.get(local + url.pathname + url.search);
    await route.fulfill({ response });
  });
  await context.route('https://analytics.ljhboard.cn/**', async route => {
    expect(route.request().url()).toBe('https://analytics.ljhboard.cn/script.js');
    scriptRequests++;
    if (blocked) await route.abort();
    else await route.fulfill({ contentType: 'text/javascript', body: 'window.umamiTestLoaded = true;' });
  });
  try {
    await page.goto(origin + '/guide/?private=value#offline');
    await expect.poll(() => scriptRequests).toBe(1);
    const script = page.locator('#umami-analytics');
    await expect(script).toHaveAttribute('defer', '');
    await expect(script).toHaveAttribute('data-website-id', '69bf35a5-ccf1-4dca-b709-d128d73aa44f');
    for (const attribute of ['data-exclude-search', 'data-exclude-hash', 'data-do-not-track']) await expect(script).toHaveAttribute(attribute, 'true');
    await expect(script).toHaveAttribute('data-domains', 'img.ljhboard.cn');
    if (!blocked) await expect.poll(() => page.evaluate(() => window.umamiTestLoaded)).toBe(true);
    await page.getByRole('button', { name: '深色', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(scriptRequests).toBe(1);
  } finally { await context.close(); }
});

test('other product and legacy hosts do not load this analytics account', async ({ browser, request }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const analytics = [];
  page.on('request', request => { if (request.url().includes('analytics.ljhboard.cn')) analytics.push(request.url()); });
  for (const host of ['https://pdf.ljhboard.cn', 'https://folioforge.ljhboard.cn', 'https://pixelforge.ljhboard.cn']) {
    await context.route(host + '/**', async route => {
      const url = new URL(route.request().url());
      await route.fulfill({ response: await request.get(local + url.pathname + url.search) });
    });
  }
  try {
    for (const host of ['https://pdf.ljhboard.cn', 'https://folioforge.ljhboard.cn', 'https://pixelforge.ljhboard.cn']) {
      await page.goto(host + '/guide/');
      await page.getByRole('button', { name: '深色', exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await expect(page.locator('#umami-analytics')).toHaveCount(0);
    }
    expect(analytics).toEqual([]);
  } finally { await context.close(); }
});

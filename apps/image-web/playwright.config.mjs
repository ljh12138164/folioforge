import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  outputDir: './work/test-results',
  timeout: process.env.CI ? 180_000 : 120_000,
  expect: { timeout: process.env.CI ? 30_000 : 5_000 },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:43188',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    viewport: { width: 1320, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/preview.mjs',
    url: 'http://127.0.0.1:43188',
    reuseExistingServer: !process.env.CI,
  },
});

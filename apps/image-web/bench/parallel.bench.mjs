import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { cpus, totalmem, platform } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
async function residentBytes(session) {
  const { processInfo } = await session.send('SystemInfo.getProcessInfo');
  const ids = [...new Set(processInfo.map((process) => process.id))];
  if (platform() === 'win32') {
    const { stdout } = await exec('powershell.exe', ['-NoProfile', '-Command', `(Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum`]);
    return Number(stdout.trim());
  }
  const { stdout } = await exec('ps', ['-o', 'rss=', '-p', ids.join(',')]);
  return stdout.trim().split(/\s+/).reduce((sum, value) => sum + Number(value) * 1024, 0);
}

test('measure actual WASM throughput and sampled browser memory at 1, 2 and 4 workers', async ({ browser }, testInfo) => {
  const results = [];
  const session = await browser.newBrowserCDPSession();
  const cases = [
    { name: 'small', width: 640, height: 480, formats: Array(12).fill('WEBP') },
    { name: 'photo', width: 1920, height: 1280, formats: Array(8).fill('WEBP') },
    { name: 'near-limit', width: 7800, height: 6000, formats: Array(4).fill('JPEG') },
    { name: 'mixed-codecs', width: 1280, height: 960, formats: ['PNG', 'JPEG', 'WEBP', 'AVIF', 'JPEG', 'WEBP'] },
  ];
  for (const scenario of cases) for (const concurrency of [1, 2, 4]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    let peak = await residentBytes(session);
    let sampling = true;
    const sampler = (async () => {
      while (sampling) {
        peak = Math.max(peak, await residentBytes(session));
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    })();
    try {
      const workerPromise = page.waitForEvent('worker');
      await page.goto('/convert/');
      const url = (await workerPromise).url();
      await expect(page.locator('footer')).toContainText('引擎就绪');
      const metrics = await page.evaluate(async ({ url, scenario, concurrency }) => {
        const image = new Image(); image.src = '/sample-landscape.png'; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = scenario.width; canvas.height = scenario.height;
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const sourceFormat = scenario.name === 'near-limit' ? 'JPEG' : 'PNG';
        const file = await new Promise((resolve) => canvas.toBlob(resolve, sourceFormat === 'JPEG' ? 'image/jpeg' : 'image/png', 0.92));
        canvas.width = canvas.height = 0;
        const bytes = await file.arrayBuffer();
        const clients = [];
        const started = performance.now();
        try {
          await Promise.all(Array.from({ length: concurrency }, async () => {
            const worker = new Worker(url); clients.push(worker);
            await new Promise((resolve, reject) => { worker.onmessage = ({ data }) => data.type === 'ready' ? resolve() : reject(new Error(data.error)); worker.onerror = (error) => reject(new Error(error.message)); });
          }));
          const readyMs = performance.now() - started;
          let next = 0; let completed = 0; let failures = 0; let maxLagMs = 0; let tick = performance.now();
          const errors = [];
          const timer = setInterval(() => { const now = performance.now(); maxLagMs = Math.max(maxLagMs, now - tick - 25); tick = now; }, 25);
          const convertStart = performance.now();
          try {
            await Promise.all(clients.map(async (worker) => {
              while (next < scenario.formats.length) {
                const id = next++; const format = scenario.formats[id]; const copy = bytes.slice(0);
                const success = await new Promise((resolve, reject) => {
                  worker.onmessage = ({ data }) => { if (data.type !== 'result') errors.push(data.error); resolve(data.type === 'result'); }; worker.onerror = reject;
                  worker.postMessage({ id, bytes: copy, sourceFormat, options: { format, quality: 82, stripMetadata: true, background: '#ffffff' } }, [copy]);
                });
                if (success) completed++; else failures++;
              }
            }));
          } finally { clearInterval(timer); }
          return { readyMs, convertMs: performance.now() - convertStart, completed, failures, errors, maxLagMs, inputBytes: bytes.byteLength };
        } finally { clients.forEach((worker) => worker.terminate()); }
      }, { url, scenario, concurrency });
      sampling = false;
      await sampler;
      expect(metrics.completed + metrics.failures).toBe(scenario.formats.length);
      const result = { scenario: scenario.name, concurrency, ...metrics, sampledPeakMiB: peak / 1024 / 1024 };
      results.push(result);
      console.log(JSON.stringify(result));
    } finally {
      sampling = false;
      await sampler;
      await context.close();
    }
  }
  await session.detach();
  await writeFile(testInfo.outputPath('parallel.json'), JSON.stringify({
    recordedAt: new Date().toISOString(), platform: platform(), cpu: cpus()[0].model, cores: cpus().length,
    physicalMemoryGiB: totalmem() / 1024 ** 3, browser: browser.version(),
    memoryMethod: '200ms plus OS query latency; sum of browser process working sets/RSS, includes fixtures and workspace engine; sampled maximum, not exact allocation peak',
    policy: 'raw worker comparison bypasses the production limit of two; near-limit images run exclusively in production',
    results,
  }, null, 2));
});

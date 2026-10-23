// Runs the real bundled renderer, protocol, WASM worker and native downloads.
process.env.PIXELFORGE_SMOKE_TEST = '1';
const { app, session } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { join, resolve } = require('node:path');
const output = resolve(__dirname, '../work/smoke');
app.setPath('userData', join(output, 'profile'));
const timer = setTimeout(() => { console.error('Desktop smoke test timed out'); app.exit(1); }, 90000);

app.once('browser-window-created', (_event, window) => {
  window.webContents.setBackgroundThrottling(false);
  window.once('ready-to-show', () => window.showInactive());
  const js = (source) => window.webContents.executeJavaScript(source);
  const capture = async (filename) => {
    await js('new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))');
    await fs.writeFile(join(output, filename), (await window.webContents.capturePage()).toPNG());
  };
  const waitFor = async (source) => {
    for (let i = 0; i < 600; i++) {
      if (await js(source)) return;
      await new Promise((done) => setTimeout(done, 100));
    }
    throw new Error('Timed out: ' + source);
  };
  const download = async (filename, click) => {
    const path = join(output, filename);
    const completed = new Promise((done, reject) => session.defaultSession.once('will-download', (_e, item) => {
      item.setSavePath(path);
      item.once('done', (_event, state) => state === 'completed' ? done() : reject(new Error('Download: ' + state)));
    }));
    await js(click);
    await completed;
    return fs.readFile(path);
  };
  window.webContents.once('did-finish-load', async () => {
    try {
      await fs.mkdir(output, { recursive: true });
      assert.equal(await js('typeof window.require'), 'undefined');
      assert.equal(await js('typeof window.process'), 'undefined');
      assert.equal(await js('isSecureContext'), true);
      await waitFor("document.querySelector('h1')?.textContent === '在本地转换图片格式'");
      await js("[...document.querySelectorAll('button')].find(b => b.textContent === '试用示例').click()");
      await waitFor("[...document.querySelectorAll('img')].some(i => i.alt === '示例图片的实际转换结果' && i.naturalWidth > 0)");
      await waitFor("[...document.querySelectorAll('button')].some(b => b.textContent === '重新转换示例' && !b.disabled)");
      await capture('desktop-home.png');
      console.log('Desktop home and actual WebP example: passed');
      await window.loadURL('pixelforge://app/convert/?format=AVIF&quality=67&maxWidth=640');
      await waitFor("document.querySelector('footer')?.textContent.includes('14 种导出格式')");
      assert.equal(await js("document.querySelector('#quality').value"), '67');
      assert.equal(await js("document.querySelector('#max-width').value"), '640');
      assert.equal(await js("document.querySelector('.format-option.chosen').textContent"), 'AVIF');
      await js("[...document.querySelectorAll('button')].find(b => b.textContent.includes('试试这张示例')).click()");
      await waitFor("document.querySelector('.file-info strong')?.textContent === '示例-山景.png'");
      await js("document.querySelector('.convert-button').click()");
      await waitFor("!!document.querySelector('button[aria-label=\"下载 示例-山景.avif\"]')");
      await waitFor("[...document.querySelectorAll('.compare-images img')].every(i => i.complete && i.naturalWidth > 0)");
      const avif = await download('result.avif', "document.querySelector('button[aria-label=\"下载 示例-山景.avif\"]').click()");
      assert.ok(avif.subarray(0, 40).includes(Buffer.from('ftypavif')));
      const zip = await download('results.zip', "document.querySelector('.download-bar button').click()");
      assert.equal(zip.subarray(0, 2).toString(), 'PK');
      await capture('desktop-workspace.png');
      console.log('AVIF, settings handoff, native file download and ZIP: passed');
      assert.equal(await js("fetch('pixelforge://wrong/private').then(r => r.status).catch(() => 403)"), 403);
      assert.equal(await js("fetch('pixelforge://app/%2e%2e%5cpackage.json').then(r => r.status).catch(() => 403)"), 403);
      assert.equal(await js("fetch('https://example.com').then(() => false).catch(() => true)"), true);
      console.log('Sandbox, secure origin, traversal guard and external network blocking: passed');
      clearTimeout(timer);
      app.exit(0);
    } catch (error) { console.error(error); clearTimeout(timer); app.exit(1); }
  });
});
require('../src/main.cjs');

// Runs the real bundled renderer, protocol, WASM worker and native downloads.
process.env.PIXELFORGE_SMOKE_TEST = '1';
const { app, session } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { join, resolve } = require('node:path');
const output = process.env.PIXELFORGE_TEST_OUTPUT || resolve(__dirname, '../work/smoke');
require('node:fs').mkdirSync(join(output, 'profile'), { recursive: true });
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
      if (process.argv.includes('--smoke-test')) assert.equal(app.isPackaged, true);
      assert.equal(await js('typeof window.require'), 'undefined');
      assert.equal(await js('typeof window.process'), 'undefined');
      assert.equal(await js('isSecureContext'), true);
      await waitFor("document.querySelector('h1')?.textContent === 'PDF 工具箱'");
      assert.equal(await js("document.querySelectorAll('.tools-entry').length"), 19);
      await capture('desktop-tools.png');
      await window.loadURL('folioforge://app/pdf/');
      await waitFor("document.querySelector('h1')?.textContent === 'PDF 工作台'");
      await js("[...document.querySelectorAll('button')].find(b => b.textContent.includes('载入示例文档')).click()");
      await waitFor("[...document.querySelectorAll('.pdf-page-image img')].length === 3 && [...document.querySelectorAll('.pdf-page-image img')].every(i => i.complete && i.naturalWidth > 0)");
      await capture('desktop-pdf.png');
      await js("document.querySelector('.pdf-export-section button.primary').click()");
      await waitFor("!!document.querySelector('.pdf-result a')");
      const pdf = await download('document.pdf', "document.querySelector('.pdf-result a').click()");
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
      assert.equal(await js("fetch('folioforge://wrong/private').then(r => r.status).catch(() => 403)"), 403);
      assert.equal(await js("fetch('folioforge://app/%2e%2e%5cpackage.json').then(r => r.status).catch(() => 403)"), 403);
      assert.equal(await js("fetch('https://example.com').then(() => false).catch(() => true)"), true);
      console.log('Sandbox, secure origin, traversal guard and external network blocking: passed');
      clearTimeout(timer);
      app.exit(0);
    } catch (error) { console.error(error); clearTimeout(timer); app.exit(1); }
  });
});
require('../src/main.cjs');

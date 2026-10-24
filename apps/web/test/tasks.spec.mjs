import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('persistent queue: pause, reload, resume, cancel and storage failure', async ({ page, context }, testInfo) => {
  const js = (source) => page.evaluate(source);
  const waitFor = (source) => page.waitForFunction(source);
  const available = "!!document.querySelector('[aria-label=\"保存任务到此设备\"]') && !document.querySelector('[aria-label=\"保存任务到此设备\"]').disabled";
  const idle = "!document.querySelector('.convert-button').disabled";
  const click = (text) => page.getByRole('button', { name: text, exact: true }).click();
  const read = () => js(`new Promise((resolve, reject) => {
    const request = indexedDB.open('pixelforge-tasks', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('tasks');
      const all = tx.objectStore('tasks').getAll();
      tx.oncomplete = () => { db.close(); resolve(all.result.sort((a,b) => a.order-b.order).map(t => ({id:t.id, name:t.file.name, status:t.status, format:t.options?.format, size:t.output?.files.data.size}))); };
    };
  })`);
  const reload = async () => {
    await page.reload();
    await waitFor(available);
    await waitFor("document.querySelector('footer').textContent.includes('引擎就绪')");
  };
  const add = (count, broken = false) => js(`(async () => {
    const canvas = document.createElement('canvas'); canvas.width=160; canvas.height=120;
    const ctx=canvas.getContext('2d'); ctx.fillStyle='#15784b'; ctx.fillRect(0,0,160,120);
    const blob=await new Promise(resolve => canvas.toBlob(resolve));
    const data=new DataTransfer();
    for(let i=0;i<${count};i++) data.items.add(new File([blob], 'queue-'+i+'.png', {type:'image/png'}));
    if(${broken}) data.items.add(new File(['broken'], 'broken.png', {type:'image/png'}));
    const input=document.querySelector('input[type=file]'); input.files=data.files; input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  const conversions = () => js(`(() => { window.__conversions=0; const send=Worker.prototype.postMessage; Worker.prototype.postMessage=function(...args) { if(args[0]?.options) window.__conversions++; return send.apply(this,args); }; })()`);
  const startAndStop = (text) => js(`new Promise(resolve => {
    const timer=setInterval(() => {
      if(document.querySelector('.status-working')) {
        const button=[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)});
        if(button) { clearInterval(timer); button.click(); resolve(); }
      }
    },1);
    document.querySelector('.convert-button').click();
  })`);

  await page.goto('/convert/?format=PNG');
  await waitFor(available);
  await waitFor("document.querySelector('footer').textContent.includes('引擎就绪')");
  await add(1);
  await waitFor(idle);
  await js("document.querySelector('.convert-button').click()");
  await waitFor("!!document.querySelector('.status-done') && !document.querySelector('.convert-button').disabled");
  await js("document.querySelector('[aria-label=\"保存任务到此设备\"]').click()");
  await waitFor(available);
  assert.equal(await js("document.querySelector('[aria-label=\"保存任务到此设备\"]').checked"), true);
  const original = await read();
  assert.equal(original.length, 1);
  assert.equal(original[0].status, 'done');
  await reload();
  assert.deepEqual(await read(), original);
  assert.equal(await js("document.querySelectorAll('.status-done').length"), 1);
  const downloadFile = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 queue-0.png', exact: true }).click();
  await (await downloadFile).saveAs(testInfo.outputPath('restored.png'));
  assert.equal((await readFile(testInfo.outputPath('restored.png'))).subarray(1, 4).toString(), 'PNG');
  const downloadZip = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 ZIP', exact: true }).click();
  await (await downloadZip).saveAs(testInfo.outputPath('restored.zip'));
  assert.equal((await readFile(testInfo.outputPath('restored.zip'))).subarray(0, 2).toString(), 'PK');
  console.log('Saved original files and completed output survive reload: passed');

  const other = await context.newPage();
  try {
    await other.goto('/convert/');
    await expect(other.locator('.notice')).toContainText('另一窗口正在使用任务队列');
    await expect(other.locator('.convert-button')).toBeDisabled();
  } finally { await other.close(); }
  assert.deepEqual(await read(), original);
  console.log('Second window cannot overwrite the active queue: passed');

  await click('清空');
  await waitFor("document.querySelectorAll('.file-row').length === 0 && !document.querySelector('[aria-label=\"保存任务到此设备\"]').disabled");
  assert.equal((await read()).length, 0);
  await js("[...document.querySelectorAll('.format-option')].find(b => b.textContent === 'PNG').click()");
  await add(8);
  await waitFor("document.querySelectorAll('.file-row').length === 8 && !document.querySelector('.convert-button').disabled");
  await startAndStop('暂停');
  await waitFor(idle);
  const paused = await read();
  assert(paused.some((t) => t.status === 'paused'));
  assert(paused.some((t) => t.status === 'done'));
  const done = paused.filter((t) => t.status === 'done');
  await reload();
  assert.deepEqual(await read(), paused);
  await page.getByRole('button', { name: 'WebP', exact: true }).click();
  await conversions();
  await js("document.querySelector('.convert-button').click()");
  await waitFor("document.querySelectorAll('.status-done').length === 8 && !document.querySelector('.convert-button').disabled");
  assert.equal(await js('window.__conversions'), 8 - done.length);
  assert((await read()).every((t) => t.format === 'PNG'));
  assert.deepEqual((await read()).filter((t) => done.some((d) => d.id === t.id)), done);
  await page.screenshot({ path: testInfo.outputPath('restored-workspace.png'), fullPage: true });
  console.log('Pause, reload and resume skip all completed jobs: passed');

  await conversions();
  await js(`new Promise(resolve => {
    // Keep a real conversion in flight even if encoding finishes before the reload command arrives.
    const send = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(...args) {
      if (args[0]?.options) {
        const receive = this.onmessage, id = args[0].id;
        this.onmessage = event => { if (event.data.id !== id) receive?.call(this, event); };
        const result = send.apply(this, args); resolve(); return result;
      }
      return send.apply(this, args);
    };
    document.querySelector('.convert-button').click();
  })`);
  await reload();
  assert((await read()).some((t) => t.status === 'interrupted'));
  await conversions();
  const unfinished = (await read()).filter((t) => t.status !== 'done').length;
  await js("document.querySelector('.convert-button').click()");
  await waitFor("document.querySelectorAll('.status-done').length === 8 && !document.querySelector('.convert-button').disabled");
  assert.equal(await js('window.__conversions'), unfinished);
  console.log('Reload during actual conversion recovers interrupted jobs: passed');

  await startAndStop('取消剩余任务');
  await waitFor(available);
  await waitFor(idle);
  const cancelled = await read();
  assert(cancelled.some((t) => t.status === 'cancelled'));
  assert(cancelled.every((t) => !['working', 'waiting'].includes(t.status)));
  await reload();
  assert.deepEqual(await read(), cancelled);
  assert.equal(await js("document.querySelector('.convert-button').textContent.includes('继续')"), false);
  console.log('Immediate cancellation is durable and does not restart automatically: passed');

  await js("window.__put = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function(...args) { if(this.name === 'tasks') throw new DOMException('Test quota exhausted','QuotaExceededError'); return window.__put.apply(this,args); }; void 0");
  try {
    await add(1);
    await waitFor("document.querySelector('.notice')?.textContent.includes('无法保存任务变更')");
    assert.equal(await js("document.querySelectorAll('.file-row').length"), 8);
    assert.deepEqual(await read(), cancelled);
  } finally { await js('IDBObjectStore.prototype.put = window.__put; void 0'); }
  console.log('Storage write failure leaves the existing queue intact: passed');

  await js("window.__put = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function(task, ...args) { if(this.name === 'tasks' && task.status === 'done') throw new DOMException('Test result quota exhausted','QuotaExceededError'); return window.__put.call(this,task,...args); }; void 0");
  try {
    await conversions();
    await page.locator('.convert-button').click();
    await expect(page.locator('.notice')).toContainText('任务保存失败');
    assert(await js('window.__conversions >= 1 && window.__conversions <= 2'));
    assert.equal((await read()).filter((t) => t.status === 'done').length, 0);
    await expect(page.locator('.status-done')).toHaveCount(0);
  } finally { await js('IDBObjectStore.prototype.put = window.__put; void 0'); }
  await reload();
  assert((await read()).some((t) => t.status === 'interrupted'));
  console.log('Result write failure stops the queue without claiming completion: passed');

  await click('清空');
  await waitFor("document.querySelectorAll('.file-row').length === 0 && !document.querySelector('[aria-label=\"保存任务到此设备\"]').disabled");
  await add(1, true);
  await waitFor("document.querySelectorAll('.file-row').length === 2 && !document.querySelector('.convert-button').disabled");
  await js("document.querySelector('.convert-button').click()");
  await waitFor("!!document.querySelector('.status-error') && !document.querySelector('.convert-button').disabled");
  await conversions();
  await click('重试失败项');
  await waitFor(idle);
  assert.equal(await js('window.__conversions'), 1);
  assert.equal(await js("document.querySelectorAll('.status-done').length"), 1);
  await js("document.querySelector('[aria-label=\"保存任务到此设备\"]').click()");
  await waitFor(available);
  assert.equal((await read()).length, 0);
  await reload();
  assert.equal(await js("document.querySelectorAll('.file-row').length"), 0);
  console.log('Retry handles failed jobs only; disabling storage removes disk copies: passed');
  await page.screenshot({ path: testInfo.outputPath('workspace.png'), fullPage: true });
});

test('saved input survives closing and relaunching the browser', async ({ playwright }, testInfo) => {
  const profile = testInfo.outputPath('profile');
  const launch = () => playwright.chromium.launchPersistentContext(profile, { headless: true, channel: testInfo.project.use.channel });
  let context = await launch();
  try {
    let page = await context.newPage();
    await page.goto('http://127.0.0.1:43188/convert/?format=PNG');
    await page.getByRole('checkbox', { name: '保存任务到此设备', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: '保存任务到此设备', exact: true })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: '保存任务到此设备', exact: true })).toBeEnabled();
    await page.locator('input[type=file]').setInputFiles({ name: 'restart.png', mimeType: 'image/png', buffer: await readFile(new URL('../public/sample-landscape.png', import.meta.url)) });
    await expect(page.locator('.file-row')).toHaveCount(1);
    await context.close();
    context = await launch();
    page = await context.newPage();
    await page.goto('http://127.0.0.1:43188/convert/');
    await expect(page.locator('.file-info strong')).toHaveText('restart.png');
    await page.locator('.convert-button').click();
    await expect(page.locator('.status-done')).toHaveCount(1);
  } finally { await context.close(); }
});

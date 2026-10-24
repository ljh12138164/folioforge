const { app, BrowserWindow, ipcMain, Menu, nativeTheme, net, protocol, session } = require('electron');
const { stat } = require('node:fs/promises');
const { resolve, join, basename } = require('node:path');
const { pathToFileURL } = require('node:url');
const { assetPath } = require('./asset-path.cjs');

if (process.argv.includes('--smoke-test')) require('../test/smoke.cjs');

app.setName('PixelForge');
protocol.registerSchemesAsPrivileged([{ scheme: 'pixelforge', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
const origin = 'pixelforge://app';
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-src 'none'";

async function createWindow() {
  const window = new BrowserWindow({ width: 1320, height: 920, minWidth: 760, minHeight: 640, title: 'FolioForge · 页匠', icon: join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png'), backgroundColor: nativeTheme.shouldUseDarkColors ? '#0f1219' : '#f5f6fa', show: !process.env.PIXELFORGE_SMOKE_TEST,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, preload: join(__dirname, 'preload.cjs') },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => { if (!url.startsWith(origin + '/')) event.preventDefault(); });
  await window.loadURL(origin + '/');
  return window;
}

app.whenReady().then(async () => {
  ipcMain.on('theme:set', (event, preference) => {
    if (event.senderFrame?.url.startsWith(origin + '/') && ['system', 'light', 'dark'].includes(preference)) nativeTheme.themeSource = preference;
  });
  nativeTheme.on('updated', () => {
    for (const window of BrowserWindow.getAllWindows()) window.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#0f1219' : '#f5f6fa');
  });
  const root = app.isPackaged ? join(app.getAppPath(), 'web') : resolve(__dirname, '../../web/out');
  protocol.handle('pixelforge', async (request) => {
    try {
      const url = new URL(request.url);
      if (url.host !== 'app' || !['GET', 'HEAD'].includes(request.method)) return new Response('Forbidden', { status: 403 });
      let file = assetPath(root, url.pathname);
      if (!file) return new Response('Forbidden', { status: 403 });
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const result = await net.fetch(pathToFileURL(file).toString());
      const headers = new Headers(result.headers);
      headers.set('Content-Security-Policy', csp);
      if (file.endsWith('.wasm')) headers.set('Content-Type', 'application/wasm');
      return new Response(request.method === 'HEAD' ? null : result.body, { status: result.status, headers });
    } catch { return new Response('Not found', { status: 404 }); }
  });
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  // All product resources are bundled; conversion never needs an external request.
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => callback({ cancel: /^https?:/i.test(details.url) }));
  session.defaultSession.on('will-download', (_event, item) => item.setSaveDialogOptions({ title: '保存转换结果', defaultPath: join(app.getPath('downloads'), basename(item.getFilename())) }));
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { label: '文件', submenu: [{ role: 'close', label: '关闭窗口' }] },
    { label: '编辑', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: '视图', submenu: [{ role: 'reload', label: '重新加载' }, { role: 'resetZoom', label: '实际大小' }, { role: 'zoomIn', label: '放大' }, { role: 'zoomOut', label: '缩小' }, { role: 'togglefullscreen', label: '全屏' }] },
  ]));
  await createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
}).catch((error) => { console.error(error); app.exit(1); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

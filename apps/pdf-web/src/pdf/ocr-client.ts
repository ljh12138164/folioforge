import type { Page } from 'tesseract.js';

// Protocol matches the pinned Tesseract.js 7 worker. Owning the Worker lets cancel
// terminate initialization as well as recognition; the public factory returns it only after initialization.
export function createOcrClient(onProgress: (progress: number) => void) {
  const worker = new Worker('/pdf-assets/ocr/v7/worker.min.js');
  let sequence = 0, stopped = false;
  const pending = new Map<string, { resolve: (data: unknown) => void; reject: (error: Error) => void }>();
  function destroy() {
    stopped = true; worker.terminate();
    for (const task of pending.values()) task.reject(new Error('OCR 已取消。'));
    pending.clear();
  }
  worker.onerror = () => {
    for (const task of pending.values()) task.reject(new Error('OCR 引擎加载失败，请联网刷新，等待离线缓存完成后重试。'));
    destroy();
  };
  worker.onmessage = ({ data }) => {
    const task = pending.get(data.jobId);
    if (!task) return;
    if (data.status === 'progress') { if (data.data.status === 'recognizing text') onProgress(data.data.progress); return; }
    pending.delete(data.jobId);
    if (data.status === 'reject') task.reject(new Error(`OCR 处理失败：${String(data.data)}`));
    else task.resolve(data.data);
  };
  function run<T = unknown>(action: string, payload: unknown): Promise<T> {
    if (stopped) return Promise.reject(new Error('OCR 已取消。'));
    return new Promise((resolve, reject) => {
      const jobId = String(++sequence);
      pending.set(jobId, { resolve: resolve as (data: unknown) => void, reject });
      worker.postMessage({ workerId: 'pixelforge', jobId, action, payload });
    });
  }
  return {
    async initialize(langs: string) {
      const root = new URL('/pdf-assets/ocr/v7/', location.href).href;
      await run('load', { options: { lstmOnly: true, corePath: `${root}core`, logging: false } });
      await run('loadLanguage', { langs, options: { langPath: `${root}lang`, gzip: false, cachePath: 'pixelforge-fast-87416418-v7', cacheMethod: 'none', lstmOnly: true } });
      await run('initialize', { langs, oem: 1, config: {} });
    },
    async recognize(image: Uint8Array, pdf: boolean, dpi: number) {
      await run('setParameters', { params: { user_defined_dpi: String(Math.round(dpi)) } });
      return run<Page>('recognize', { image, options: { pdfTextOnly: false }, output: { text: true, pdf } });
    },
    destroy,
  };
}

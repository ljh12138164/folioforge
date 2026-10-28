import type { PdfRequest } from './worker';

export function createPdfClient() {
  const worker = new Worker(new URL('./worker.ts', import.meta.url));
  let sequence = 0;
  let stopped = '';
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void; progress?: (n: number) => void }>();
  worker.onmessage = ({ data }) => {
    const task = pending.get(data.id);
    if (!task) return;
    if (data.progress !== undefined) { task.progress?.(data.progress); return; }
    pending.delete(data.id);
    if (data.error) task.reject(new Error(data.error)); else task.resolve(data.result);
  };
  const stop = (message: string) => {
    stopped = message;
    worker.terminate();
    for (const task of pending.values()) task.reject(new Error(message));
    pending.clear();
  };
  worker.onerror = () => stop('PDF 处理引擎加载失败，请刷新页面后重试。');
  return {
    run<T>(request: PdfRequest, progress?: (n: number) => void): Promise<T> {
      if (stopped) return Promise.reject(new Error(stopped));
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        pending.set(id, { resolve: resolve as (value: unknown) => void, reject, progress });
        worker.postMessage({ ...request, id });
      });
    },
    destroy() { stop('操作已取消。'); },
  };
}

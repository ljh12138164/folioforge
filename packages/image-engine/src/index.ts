import type { Capability, Conversion, ConvertOptions, WorkerResponse } from './types';
import { formats, MAX_FILE_BYTES, MAX_PIXELS } from './types';
export { formats, MAX_FILE_BYTES } from './types';
export type { Capability, Conversion, ConvertOptions, FormatId } from './types';

async function readFile(file: File): Promise<ArrayBuffer> {
  if (!file.size || file.size > MAX_FILE_BYTES) throw new Error('请选择非空、且不超过 40 MB 的图片。');
  if (!/\.svg$/i.test(file.name)) return file.arrayBuffer();
  // Native SVG rasterization avoids server-only SVG delegates and keeps external resources disabled in image context.
  const url = URL.createObjectURL(new Blob([file], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > MAX_PIXELS) {
      throw new Error('SVG 尺寸无效或超过 4800 万像素，请设置有效的宽高。');
    }
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d')!.drawImage(image, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('SVG 栅格化失败。')), 'image/png'));
    canvas.width = canvas.height = 0;
    return png.arrayBuffer();
  } finally { URL.revokeObjectURL(url); }
}

export function createEngine(worker: Worker) {
  let nextId = 0;
  let fatalError: Error | undefined;
  const pending = new Map<number, { resolve: (result: Conversion) => void; reject: (error: Error) => void }>();
  let readyResolve: (capabilities: Capability[]) => void;
  let readyReject: (error: Error) => void;
  const ready = new Promise<Capability[]>((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  function fail(error: Error) {
    fatalError = error;
    readyReject(error);
    pending.forEach(({ reject }) => reject(error));
    pending.clear();
  }
  worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
    if (data.type === 'ready') return readyResolve(data.capabilities);
    if (data.type === 'error' && data.id === undefined) return fail(new Error(data.error));
    if (data.id === undefined) return;
    const job = pending.get(data.id);
    pending.delete(data.id);
    if (data.type === 'result') job?.resolve(data.result);
    else job?.reject(new Error(data.error));
  };
  worker.onerror = () => fail(new Error('转换引擎意外停止，请重新加载引擎。'));
  return {
    ready,
    async convert(file: File, options: ConvertOptions) {
      await ready;
      if (fatalError) throw fatalError;
      const bytes = await readFile(file);
      const extension = file.name.split('.').pop()?.toLowerCase();
      const sourceFormat = extension === 'svg' ? 'PNG' : extension === 'heif' ? 'HEIC' : extension === 'tif' ? 'TIFF' : extension === 'jpeg' ? 'JPEG' : formats.find((format) => format.extension === extension)?.id;
      const id = ++nextId;
      return new Promise<Conversion>((resolve, reject) => {
        pending.set(id, { resolve, reject });
        worker.postMessage({ id, bytes, options, sourceFormat }, [bytes]);
      });
    },
    dispose() { fail(new Error('转换已取消。')); worker.terminate(); },
  };
}

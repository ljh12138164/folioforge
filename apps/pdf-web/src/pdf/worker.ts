import { createSample, exportPdf, inspectFile } from './core';
import type { PdfPage, PdfSource } from './core';
import { transformPdf } from './operations';
import type { PdfOperation } from './operations';
import { optimizePdf } from './compression';

export type PdfRequest =
  | { action: 'inspect'; bytes: Uint8Array; name: string }
  | { action: 'export'; sources: PdfSource[]; pages: PdfPage[]; title: string; split: boolean }
  | { action: 'transform'; sources: PdfSource[]; pages: PdfPage[]; title: string; operation: PdfOperation }
  | { action: 'sample' }
  | { action: 'optimize'; sources: PdfSource[]; pages: PdfPage[]; title: string };

self.onmessage = async ({ data }: MessageEvent<PdfRequest & { id: number }>) => {
  try {
    let result: unknown;
    if (data.action === 'inspect') result = await inspectFile(data.bytes, data.name);
    else if (data.action === 'sample') result = await createSample();
    else if (data.action === 'optimize') result = await optimizePdf(data.sources, data.pages, data.title);
    else if (data.action === 'transform') result = await transformPdf(data.sources, data.pages, data.title, data.operation, progress => self.postMessage({ id: data.id, progress }));
    else {
      const outputs: Uint8Array[] = [];
      const documents = new Map();
      const groups = data.split ? data.pages.map(p => [p]) : [data.pages];
      for (let i = 0; i < groups.length; i++) {
        outputs.push(await exportPdf(data.sources, groups[i], data.title, documents));
        self.postMessage({ id: data.id, progress: Math.round(((i + 1) / groups.length) * 100) });
      }
      result = outputs;
    }
    self.postMessage({ id: data.id, result });
  } catch (error) {
    self.postMessage({ id: data.id, error: error instanceof Error ? error.message : '处理失败，请重试。' });
  }
};

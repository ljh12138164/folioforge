import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfPage, PdfSource } from './core';

export function createPdfRenderer() {
  let library: Promise<typeof import('pdfjs-dist')> | undefined;
  const documents = new Map<string, Promise<PDFDocumentProxy>>();
  function getDocument(source: PdfSource) {
    let document = documents.get(source.id);
    if (!document) {
      library ??= import('pdfjs-dist').then(pdfjs => {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-assets/pdf.worker.min.mjs';
        return pdfjs;
      });
      document = library.then(pdfjs => pdfjs.getDocument({
        data: source.bytes.slice(),
        cMapUrl: '/pdf-assets/cmaps/', cMapPacked: true,
        standardFontDataUrl: '/pdf-assets/standard_fonts/',
        wasmUrl: '/pdf-assets/wasm/', iccUrl: '/pdf-assets/iccs/',
        maxImageSize: 40_000_000,
      }).promise);
      documents.set(source.id, document);
    }
    return document;
  }
  return {
    getDocument,
    release(id: string) {
      const doc = documents.get(id);
      if (doc) void doc.then(d => d.loadingTask.destroy()).catch(() => {});
      documents.delete(id);
    },
    retain(ids: Set<string>) {
      for (const [id, doc] of documents) if (!ids.has(id)) {
        void doc.then(d => d.loadingTask.destroy()).catch(() => {});
        documents.delete(id);
      }
    },
    destroy() {
      for (const doc of documents.values()) void doc.then(d => d.loadingTask.destroy()).catch(() => {});
      documents.clear();
    },
  };
}

export async function pageText(doc: PDFDocumentProxy, index: number) {
  const page = await doc.getPage(index + 1);
  const content = await page.getTextContent();
  let text = '';
  let previous: { transform: number[]; width: number; height: number; hasEOL: boolean } | undefined;
  for (const item of content.items) {
    if (!('str' in item)) continue;
    if (previous && !previous.hasEOL && text && !/\s$/.test(text) && item.str && !/^\s/.test(item.str)) {
      const gap = item.transform[4] - previous.transform[4] - previous.width;
      if (gap > Math.max(previous.height, item.height) * .2) text += ' ';
    }
    text += item.str + (item.hasEOL ? '\n' : '');
    previous = item;
  }
  return text.trim();
}

export async function watermarkImage(text: string, color: string) {
  text = text.trim();
  if (!text || text.length > 100) throw new Error('水印文字请填写 1–100 个字符。');
  if (!/^#[\da-f]{6}$/i.test(color)) throw new Error('请选择有效的水印颜色。');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法生成水印。');
  const family = '"Microsoft YaHei", "PingFang SC", sans-serif';
  context.font = `96px ${family}`;
  const size = Math.min(96, 96 * 3000 / Math.max(1, context.measureText(text).width));
  context.font = `${size}px ${family}`;
  const metrics = context.measureText(text);
  const left = Math.max(0, metrics.actualBoundingBoxLeft), right = Math.max(metrics.width, metrics.actualBoundingBoxRight);
  canvas.width = Math.ceil(left + right + 32);
  canvas.height = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 32);
  context.font = `${size}px ${family}`; context.fillStyle = color;
  context.fillText(text, left + 16, metrics.actualBoundingBoxAscent + 16);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('水印生成失败。')), 'image/png'));
  canvas.width = 0; canvas.height = 0;
  return new Uint8Array(await blob.arrayBuffer());
}

export async function renderPage(doc: PDFDocumentProxy, ref: PdfPage, canvas: HTMLCanvasElement, scale: number) {
  const page = await doc.getPage(ref.index + 1);
  const natural = page.getViewport({ scale: 1, rotation: ref.rotation });
  // Bound the backing canvas even when a PDF declares an unusually large page.
  scale = Math.min(scale, 4096 / natural.width, 4096 / natural.height, Math.sqrt(12_000_000 / (natural.width * natural.height)));
  const viewport = page.getViewport({ scale, rotation: ref.rotation });
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const task = page.render({ canvas, viewport, background: '#ffffff' });
  await task.promise;
}

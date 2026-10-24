import { PDFDocument, degrees } from 'pdf-lib';
import { MAX_TOTAL_BYTES } from './core';
import type { PdfPage, PdfSource } from './core';
import { pageText, renderPage, createPdfRenderer } from './renderer';
import type { createOcrClient } from './ocr-client';

type Context = { pages: PdfPage[]; sources: PdfSource[]; renderer: ReturnType<typeof createPdfRenderer>; cancelled: () => boolean; progress: (index: number, total: number) => void };
export type RecognizedPage = { id: string; number: number; text: string };
async function raster(ctx: Context, ref: PdfPage, dpi: number) {
  const doc = await ctx.renderer.getDocument(ctx.sources.find(s => s.id === ref.sourceId)!);
  const page = await doc.getPage(ref.index + 1), view = page.getViewport({ scale: 1, rotation: ref.rotation });
  const canvas = document.createElement('canvas');
  const scale = Math.min(dpi / 72, 3000 / Math.max(view.width, view.height), Math.sqrt(4_000_000 / (view.width * view.height)));
  try { await renderPage(doc, ref, canvas, scale); }
  catch (error) { canvas.width = 0; canvas.height = 0; throw error; }
  return { canvas, width: view.width, height: view.height, dpi: scale * 72 };
}
async function encoded(canvas: HTMLCanvasElement, type: string, quality?: number) {
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('页面编码失败，请降低分辨率重试。')), type, quality));
  return new Uint8Array(await blob.arrayBuffer());
}
function check(ctx: Context) { if (ctx.cancelled()) throw new Error('操作已取消。'); }

export async function recognizePdf(ctx: Context, ocr: ReturnType<typeof createOcrClient>, options: { language: string; format: string; dpi: number; force: boolean }) {
  if (ctx.pages.length > 20) throw new Error('OCR 每批最多 20 页，请选择页面分批识别；手机建议每批 1–3 页。');
  const output = await PDFDocument.create(), texts: RecognizedPage[] = [], copied = new Map<string, PDFDocument>();
  let initialized = false, length = 0, generatedBytes = 0;
  for (let i = 0; i < ctx.pages.length; i++) {
    check(ctx); ctx.progress(i, ctx.pages.length);
    const ref = ctx.pages[i], source = ctx.sources.find(s => s.id === ref.sourceId)!;
    const originalText = !options.force ? await pageText(await ctx.renderer.getDocument(source), ref.index) : '';
    let text: string;
    if (originalText.trim()) {
      text = originalText;
      if (options.format === 'pdf') {
        if (!copied.has(source.id)) copied.set(source.id, await PDFDocument.load(source.bytes, { updateMetadata: false }));
        const [page] = await output.copyPages(copied.get(source.id)!, [ref.index]);
        page.setRotation(degrees(ref.rotation)); output.addPage(page);
      }
    } else {
      if (!initialized) { await ocr.initialize(options.language); initialized = true; }
      check(ctx);
      const { canvas, width, height, dpi } = await raster(ctx, ref, options.dpi);
      try {
        check(ctx);
        const result = await ocr.recognize(await encoded(canvas, 'image/png'), options.format === 'pdf', dpi);
        check(ctx); text = result.text?.trim() ?? '';
        if (options.format === 'pdf') {
          if (!result.pdf) throw new Error('OCR 未生成可搜索 PDF，请改用 TXT 或重试。');
          generatedBytes += result.pdf.length;
          if (generatedBytes > MAX_TOTAL_BYTES) throw new Error('OCR 图片结果超过 100 MiB，请缩小页面范围。');
          const [imagePage] = await output.embedPdf(new Uint8Array(result.pdf));
          output.addPage([width, height]).drawPage(imagePage, { x: 0, y: 0, width, height });
        }
      } finally { canvas.width = 0; canvas.height = 0; }
    }
    length += text.length;
    if (length > 5_000_000) throw new Error('识别文字超过 500 万字符，请缩小页面范围。');
    texts.push({ id: ref.id, number: i + 1, text });
    ctx.progress(i + 1, ctx.pages.length);
  }
  check(ctx);
  const bytes = options.format === 'pdf' ? await output.save() : undefined;
  if (bytes && bytes.length > MAX_TOTAL_BYTES) throw new Error('OCR 输出超过 100 MiB，请缩小页面范围。');
  return { texts, bytes };
}

export async function downsamplePdf(ctx: Context, dpi: number, quality: number) {
  const output = await PDFDocument.create();
  let size = 0;
  for (let i = 0; i < ctx.pages.length; i++) {
    check(ctx); ctx.progress(i, ctx.pages.length);
    const { canvas, width, height } = await raster(ctx, ctx.pages[i], dpi);
    try {
      check(ctx);
      const image = await encoded(canvas, 'image/jpeg', quality);
      size += image.length;
      if (size > MAX_TOTAL_BYTES) throw new Error('图片结果超过 100 MiB，请降低清晰度或分批处理。');
      const jpg = await output.embedJpg(image);
      output.addPage([width, height]).drawImage(jpg, { x: 0, y: 0, width, height });
    } finally { canvas.width = 0; canvas.height = 0; }
    ctx.progress(i + 1, ctx.pages.length);
  }
  check(ctx);
  const bytes = await output.save();
  if (bytes.length > MAX_TOTAL_BYTES) throw new Error('输出超过 100 MiB，请降低清晰度或分批处理。');
  return bytes;
}

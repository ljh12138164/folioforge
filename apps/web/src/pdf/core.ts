import { PDFDocument, PDFName, StandardFonts, degrees, rgb } from 'pdf-lib';

export const MAX_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
export const MAX_PAGES = 200;
export type PdfSource = { id: string; name: string; bytes: Uint8Array; originalSize: number };
export type PdfPage = { id: string; sourceId: string; index: number; rotation: number };
export type ImportedPdf = { bytes: Uint8Array; rotations: number[]; width: number; height: number };

export function parsePageRange(input: string, count: number): number[] {
  if (!input.trim()) throw new Error('请填写页码，例如 1-3, 5。');
  const result = new Set<number>();
  for (const part of input.replaceAll('，', ',').split(',')) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error('页码格式不正确，请使用 1-3, 5 这样的格式。');
    const start = Number(match[1]);
    const end = Number(match[2] ?? start);
    if (start < 1 || end > count || start > end) throw new Error(`页码必须在 1–${count} 之间，范围从小到大填写。`);
    for (let n = start; n <= end; n++) result.add(n - 1);
  }
  return [...result].sort((a, b) => a - b);
}

export function movePage(pages: PdfPage[], from: number, to: number): PdfPage[] {
  if (from < 0 || to < 0 || from >= pages.length || to >= pages.length || from === to) return pages;
  const next = [...pages];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

export function interleavePages(front: PdfPage[], back: PdfPage[], reverseBack: boolean): PdfPage[] {
  const reverse = reverseBack ? [...back].reverse() : back;
  const result: PdfPage[] = [];
  for (let i = 0; i < Math.max(front.length, reverse.length); i++) {
    if (front[i]) result.push(front[i]);
    if (reverse[i]) result.push(reverse[i]);
  }
  return result;
}

export function safeFilename(value: string): string {
  return (value.replace(/\.pdf$/i, '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim().replace(/[. ]+$/, '').slice(0, 100) || 'pixelforge-document');
}

async function loadPdf(bytes: Uint8Array) {
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    if (error instanceof Error && /encrypt|password/i.test(error.message)) throw new Error('此 PDF 已加密，请先用原软件解密后再导入。');
    throw new Error('无法读取此 PDF，文件可能已损坏或格式不受支持。');
  }
}

export async function inspectFile(bytes: Uint8Array, name: string): Promise<ImportedPdf> {
  if (!bytes.length) throw new Error('文件为空，请重新选择。');
  if (bytes.length > MAX_FILE_BYTES) throw new Error('单个文件不能超过 40 MiB。');
  const isPng = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const isJpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  let doc: PDFDocument;
  if (isPng || isJpeg) {
    try {
      doc = await PDFDocument.create();
      const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      if (image.width * image.height > 40_000_000) throw new Error('图片不能超过 4000 万像素。');
      const landscape = image.width > image.height;
      const page = doc.addPage(landscape ? [841.89, 595.28] : [595.28, 841.89]);
      const { width, height } = page.getSize();
      const scale = Math.min((width - 48) / image.width, (height - 48) / image.height);
      page.drawImage(image, { x: (width - image.width * scale) / 2, y: (height - image.height * scale) / 2, width: image.width * scale, height: image.height * scale });
      bytes = await doc.save();
    } catch (error) {
      if (error instanceof Error && error.message.includes('4000')) throw error;
      throw new Error('图片无法读取，请选择有效的 PNG 或 JPG 文件。');
    }
  } else {
    if (!new TextDecoder().decode(bytes.subarray(0, 1024)).includes('%PDF-')) throw new Error(`${name} 不是有效的 PDF、PNG 或 JPG 文件。`);
    doc = await loadPdf(bytes);
  }
  if (!doc.getPageCount()) throw new Error('此 PDF 没有可用页面。');
  if (doc.getPageCount() > MAX_PAGES) throw new Error('单次工作台最多处理 200 页，请先拆分文档。');
  if (doc.catalog.has(PDFName.of('AcroForm')) && doc.getForm().getFields().length) throw new Error('此 PDF 含交互表单或签名字段，请先在原软件中打印为静态 PDF。');
  const first = doc.getPage(0).getSize();
  return { bytes, rotations: doc.getPages().map(p => ((p.getRotation().angle % 360) + 360) % 360), ...first };
}

export async function exportPdf(sources: PdfSource[], pages: PdfPage[], title: string, docs = new Map<string, PDFDocument>()): Promise<Uint8Array> {
  if (!pages.length) throw new Error('请至少保留一页。');
  const result = await PDFDocument.create();
  for (const source of sources) if (!docs.has(source.id) && pages.some(p => p.sourceId === source.id)) docs.set(source.id, await loadPdf(source.bytes));
  for (const ref of pages) {
    const source = docs.get(ref.sourceId);
    if (!source || ref.index < 0 || ref.index >= source.getPageCount()) throw new Error('页面来源无效，请重新导入文档。');
    const [page] = await result.copyPages(source, [ref.index]);
    page.setRotation(degrees(ref.rotation));
    result.addPage(page);
  }
  result.setTitle(title);
  result.setCreator('FolioForge PDF');
  result.setProducer('FolioForge PDF · pdf-lib');
  return result.save();
}

export async function createSample(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const brand = rgb(0.15, 0.31, 0.86);
  const sections = [
    ['A little more order.', 'A local workspace for your documents.', 'Arrange your pages. Keep the originals.'],
    ['Make room for ideas.', 'Bring documents together, one page at a time.', 'Move, rotate, extract. Your files stay here.'],
    ['Ready to share.', 'A fresh document, exactly as you arranged it.', 'This is a synthetic sample. No personal data.'],
  ];
  sections.forEach(([heading, sub, line], i) => {
    const page = doc.addPage([595.28, 841.89]);
    page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: rgb(0.96, 0.97, 0.99) });
    page.drawRectangle({ x: 44, y: 758, width: 32, height: 32, color: brand });
    page.drawText('FF', { x: 50, y: 768, size: 15, font: bold, color: rgb(1, 1, 1) });
    page.drawText('FOLIOFORGE / PDF', { x: 88, y: 768, size: 11, font: bold, color: brand });
    page.drawText(heading, { x: 44, y: 606, size: 34, font: bold, color: brand });
    page.drawText(sub, { x: 44, y: 572, size: 15, font: regular, color: rgb(0.35, 0.38, 0.46) });
    for (let n = 0; n < 5; n++) page.drawRectangle({ x: 44, y: 456 - n * 35, width: [460, 410, 450, 330, 380][(n + i) % 5], height: 9, color: rgb(0.85, 0.88, 0.94) });
    page.drawText(line, { x: 44, y: 180, size: 12, font: regular, color: brand });
    page.drawLine({ start: { x: 44, y: 82 }, end: { x: 551, y: 82 }, thickness: 1, color: rgb(0.82, 0.85, 0.91) });
    page.drawText('SYNTHETIC SAMPLE', { x: 44, y: 58, size: 9, font: regular, color: brand });
    page.drawText(`0${i + 1} / 03`, { x: 503, y: 58, size: 10, font: bold, color: brand });
  });
  return doc.save();
}

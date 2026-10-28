import { PDFDocument, PDFName, PDFNumber, StandardFonts, concatTransformationMatrix, degrees, popGraphicsState, pushGraphicsState, rgb } from 'pdf-lib';
import type { PDFPage } from 'pdf-lib';
import { exportPdf } from './core';
import type { ImportedPdf, PdfPage, PdfSource } from './core';
import { stampPlacement } from './analysis';

export type PdfOperation =
  | { kind: 'numbers'; start: number; size: number; position: 'top' | 'bottom'; align: 'left' | 'center' | 'right'; total: boolean }
  | { kind: 'watermark'; text: string; color: string; opacity: number; angle: number; width: number; image?: Uint8Array }
  | { kind: 'stamp'; image: Uint8Array; opacity: number; angle: number; width: number; x: number; y: number }
  | { kind: 'crop'; top: number; right: number; bottom: number; left: number }
  | { kind: 'fit' | 'nup'; landscape: boolean; margin: number; gap: number; count: 2 | 4 };
const mm = 72 / 25.4;
function bounded(value: number, min: number, max: number, label: string) {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${label}必须在 ${min}–${max} 之间。`);
}

// All controls use the visible, rotated page in physical points, including UserUnit.
function visible(page: PDFPage) {
  const crop = page.getCropBox(), media = page.getMediaBox();
  const x = Math.max(crop.x, media.x), y = Math.max(crop.y, media.y);
  const w = Math.min(crop.x + crop.width, media.x + media.width) - x;
  const h = Math.min(crop.y + crop.height, media.y + media.height) - y;
  const r = ((page.getRotation().angle % 360) + 360) % 360;
  const unit = page.node.lookupMaybe(PDFName.of('UserUnit'), PDFNumber)?.asNumber() ?? 1;
  if (![x, y, w, h, unit].every(Number.isFinite) || w <= 0 || h <= 0 || unit <= 0 || r % 90) throw new Error('页面可见区域或旋转角度无效。');
  const u = 1 / unit;
  const matrix = r === 0 ? [u, 0, 0, u, x, y] : r === 90 ? [0, u, -u, 0, x + w, y] : r === 180 ? [-u, 0, 0, -u, x + w, y + h] : [0, -u, u, 0, x, y + h];
  return { x, y, w, h, r, width: (r % 180 ? h : w) * unit, height: (r % 180 ? w : h) * unit, matrix: matrix as [number, number, number, number, number, number] };
}

export async function transformPdf(sources: PdfSource[], refs: PdfPage[], title: string, operation: PdfOperation, progress: (n: number) => void = () => {}): Promise<ImportedPdf> {
  const input = await PDFDocument.load(await exportPdf(sources, refs, title), { updateMetadata: false });
  let result = input;
  const font = operation.kind === 'numbers' ? await input.embedFont(StandardFonts.Helvetica) : undefined;
  const image = (operation.kind === 'watermark' || operation.kind === 'stamp') && operation.image ? await input.embedPng(operation.image) : undefined;
  if (operation.kind === 'numbers') {
    bounded(operation.start, 1, 999999, '起始页码'); bounded(operation.size, 8, 36, '字号');
    if (!Number.isInteger(operation.start)) throw new Error('起始页码必须为整数。');
  } else if (operation.kind === 'watermark') {
    if (!image) throw new Error('请填写水印文字。');
    bounded(operation.opacity, .05, 1, '不透明度'); bounded(operation.angle, -90, 90, '角度'); bounded(operation.width, 20, 90, '水印宽度');
  } else if (operation.kind === 'stamp') {
    if (!image) throw new Error('请先手写签名或选择 PNG / JPG 图片。');
    bounded(operation.opacity, .05, 1, '不透明度'); bounded(operation.angle, -90, 90, '角度'); bounded(operation.width, 1, 90, '图片宽度');
    bounded(operation.x, 0, 100, '横向位置'); bounded(operation.y, 0, 100, '纵向位置');
  } else if (operation.kind === 'crop') {
    for (const side of ['top', 'right', 'bottom', 'left'] as const) bounded(operation[side], 0, 200, '裁剪边距');
  } else {
    bounded(operation.margin, 0, 60, '纸张留白'); bounded(operation.gap, 0, 40, '页面间距');
    if (operation.count !== 2 && operation.count !== 4) throw new Error('请选择 2 或 4 页拼版。');
    result = await PDFDocument.create();
    result.setTitle(title); result.setCreator('PixelForge PDF');
  }
  const sheet = operation.kind === 'fit' || operation.kind === 'nup' ? (operation.landscape ? [841.89, 595.28] : [595.28, 841.89]) : [];
  let target: PDFPage | undefined;
  for (let i = 0; i < input.getPageCount(); i++) {
    const page = input.getPage(i), v = visible(page);
    if (operation.kind === 'numbers') {
      const text = `${operation.start + i}${operation.total ? ` / ${operation.start + refs.length - 1}` : ''}`;
      const width = font!.widthOfTextAtSize(text, operation.size);
      if (v.width < width + 24 || v.height < operation.size + 32) throw new Error(`第 ${i + 1} 页过小，请减小页码字号。`);
      const x = operation.align === 'left' ? 18 : operation.align === 'right' ? v.width - width - 18 : (v.width - width) / 2;
      page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...v.matrix));
      page.drawText(text, { x, y: operation.position === 'bottom' ? 16 : v.height - 16 - operation.size, font, size: operation.size, color: rgb(.15, .18, .16) });
      page.pushOperators(popGraphicsState());
    } else if (operation.kind === 'watermark') {
      let width = v.width * operation.width / 100, height = width * image!.height / image!.width;
      const angle = operation.angle * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
      const fit = Math.min(1, v.width * .9 / (Math.abs(c) * width + Math.abs(s) * height), v.height * .9 / (Math.abs(s) * width + Math.abs(c) * height));
      width *= fit; height *= fit;
      page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...v.matrix));
      page.drawImage(image!, { x: (v.width - c * width + s * height) / 2, y: (v.height - s * width - c * height) / 2, width, height, rotate: degrees(operation.angle), opacity: operation.opacity });
      page.pushOperators(popGraphicsState());
    } else if (operation.kind === 'stamp') {
      const box = stampPlacement(v.width, v.height, image!.width, image!.height, operation.width, operation.x, operation.y, operation.angle);
      page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...v.matrix));
      page.drawImage(image!, { x: box.x, y: box.y, width: box.width, height: box.height, rotate: degrees(operation.angle), opacity: operation.opacity });
      page.pushOperators(popGraphicsState());
    } else if (operation.kind === 'crop') {
      const left = operation.left * mm, bottom = operation.bottom * mm;
      const width = v.width - left - operation.right * mm, height = v.height - bottom - operation.top * mm;
      if (width < 10 || height < 10) throw new Error(`第 ${i + 1} 页裁剪后过小，请减小边距。`);
      const [a, b, c, d, e, f] = v.matrix;
      const x1 = a * left + c * bottom + e, y1 = b * left + d * bottom + f;
      const x2 = a * (left + width) + c * (bottom + height) + e, y2 = b * (left + width) + d * (bottom + height) + f;
      page.setCropBox(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    } else {
      const count = operation.kind === 'fit' ? 1 : operation.count;
      const cols = count === 1 ? 1 : 2, rows = count === 4 ? 2 : 1;
      if (i % count === 0) target = result.addPage(sheet as [number, number]);
      const margin = operation.margin * mm, gap = operation.gap * mm;
      const cellW = (sheet[0] - margin * 2 - gap * (cols - 1)) / cols;
      const cellH = (sheet[1] - margin * 2 - gap * (rows - 1)) / rows;
      if (cellW < 10 || cellH < 10) throw new Error('留白或间距过大，请减小后重试。');
      // Empty pages can have no Contents, which pdf-lib cannot embed.
      if (page.node.Contents()) {
        const embedded = await result.embedPage(page, { left: v.x, bottom: v.y, right: v.x + v.w, top: v.y + v.h });
        const rawW = v.r % 180 ? v.h : v.w, rawH = v.r % 180 ? v.w : v.h;
        const scale = Math.min(cellW / rawW, cellH / rawH);
        const col = i % count % cols, row = Math.floor(i % count / cols);
        const x = margin + col * (cellW + gap) + (cellW - rawW * scale) / 2;
        const y = sheet[1] - margin - row * (cellH + gap) - cellH + (cellH - rawH * scale) / 2;
        target!.drawPage(embedded, { x: x + (v.r === 180 ? v.w : v.r === 270 ? v.h : 0) * scale, y: y + (v.r === 90 ? v.w : v.r === 180 ? v.h : 0) * scale, xScale: scale, yScale: scale, rotate: degrees(-v.r) });
      }
    }
    progress(Math.round((i + 1) / refs.length * 100));
  }
  const bytes = await result.save();
  return { bytes, rotations: result.getPages().map(p => p.getRotation().angle), ...result.getPage(0).getSize() };
}

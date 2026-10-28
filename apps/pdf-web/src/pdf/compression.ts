import { PDFDocument } from 'pdf-lib';
import { exportPdf } from './core';
import type { PdfSource, PdfPage } from './core';

export async function optimizePdf(sources: PdfSource[], pages: PdfPage[], title: string) {
  let original: Uint8Array;
  const used = sources.filter(s => pages.some(p => p.sourceId === s.id));
  const source = used.length === 1 ? await PDFDocument.load(used[0].bytes, { updateMetadata: false }) : undefined;
  if (source && source.getPageCount() === pages.length && pages.every((p, i) => p.index === i && p.rotation === ((source.getPage(i).getRotation().angle % 360) + 360) % 360)) original = used[0].bytes;
  else original = await exportPdf(sources, pages, title);
  const doc = await PDFDocument.load(original, { updateMetadata: false });
  const candidate = await doc.save({ useObjectStreams: true });
  return { original, bytes: candidate.length < original.length ? candidate : original };
}

import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFName, PDFNumber, degrees } from 'pdf-lib';
import { transformPdf } from './operations';
import type { PdfOperation } from './operations';

async function fixture(unit = 1) {
  const doc = await PDFDocument.create();
  for (const angle of [0, 90, 180, 270]) {
    const page = doc.addPage([300, 420]);
    page.setMediaBox(10, 20, 300, 420); page.setCropBox(30, 40, 200, 300);
    page.setRotation(degrees(angle));
    page.node.set(PDFName.of('UserUnit'), PDFNumber.of(unit));
    page.drawText(`Rotation ${angle}`, { x: 60, y: 100 });
  }
  doc.addPage([200, 300]); // A true blank page has no Contents.
  const bytes = await doc.save();
  const sources = [{ id: 'source', name: 'rotations.pdf', bytes, originalSize: bytes.length }];
  const pages = doc.getPages().map((p, index) => ({ id: String(index), sourceId: 'source', index, rotation: p.getRotation().angle }));
  return { sources, pages };
}

describe('offline PDF content operations', () => {
  it('stamps all rotations without changing original boxes, rotation, or source bytes', async () => {
    const { sources, pages } = await fixture(2);
    const original = sources[0].bytes.slice();
    const data = await transformPdf(sources, pages, 'numbered', { kind: 'numbers', start: 5, size: 12, position: 'bottom', align: 'right', total: true });
    const doc = await PDFDocument.load(data.bytes);
    expect(data.rotations).toEqual([0, 90, 180, 270, 0]);
    for (const page of doc.getPages().slice(0, 4)) expect(page.getCropBox()).toEqual({ x: 30, y: 40, width: 200, height: 300 });
    expect(doc.getPage(4).node.Contents()).toBeDefined();
    expect(sources[0].bytes).toEqual(original);
  });

  it.each([1, 2])('crops the visible four edges correctly at UserUnit=%s', async unit => {
    const { sources, pages } = await fixture(unit);
    const data = await transformPdf(sources, pages.slice(0, 4), 'crop', { kind: 'crop', top: 1, right: 2, bottom: 3, left: 4 });
    const doc = await PDFDocument.load(data.bytes), m = 72 / 25.4 / unit;
    const expected = [[30 + 4 * m, 40 + 3 * m, 200 - 6 * m, 300 - 4 * m], [30 + m, 40 + 4 * m, 200 - 4 * m, 300 - 6 * m], [30 + 2 * m, 40 + m, 200 - 6 * m, 300 - 4 * m], [30 + 3 * m, 40 + 2 * m, 200 - 4 * m, 300 - 6 * m]];
    doc.getPages().forEach((page, i) => {
      Object.values(page.getCropBox()).forEach((value, j) => expect(value).toBeCloseTo(expected[i][j]));
      expect(page.getMediaBox()).toEqual({ x: 10, y: 20, width: 300, height: 420 });
    });
  });

  it('fits mixed rotated and empty pages onto A4 and imposes incomplete 2/4-up sheets', async () => {
    const { sources, pages } = await fixture(2);
    for (const count of [1, 2, 4] as const) {
      const data = await transformPdf(sources, pages, 'layout', { kind: count === 1 ? 'fit' : 'nup', count: count === 1 ? 2 : count, landscape: count === 2, margin: 10, gap: 5 });
      const doc = await PDFDocument.load(data.bytes);
      expect(doc.getPageCount()).toBe(Math.ceil(pages.length / count));
      for (const page of doc.getPages()) {
        expect(page.getWidth()).toBeCloseTo(count === 2 ? 841.89 : 595.28);
        expect(page.getHeight()).toBeCloseTo(count === 2 ? 595.28 : 841.89);
        expect(page.getRotation().angle).toBe(0);
      }
    }
  });

  it('rejects invalid controls and oversized crops without touching the input', async () => {
    const { sources, pages } = await fixture();
    const original = sources[0].bytes.slice();
    const bad: PdfOperation[] = [
      { kind: 'numbers', start: 1.5, size: 12, position: 'top', align: 'center', total: false },
      { kind: 'numbers', start: NaN, size: 12, position: 'top', align: 'center', total: false },
      { kind: 'crop', top: 200, right: 0, bottom: 0, left: 0 },
      { kind: 'fit', landscape: true, margin: Infinity, gap: 0, count: 2 },
      { kind: 'nup', landscape: false, margin: 60, gap: 41, count: 4 },
      { kind: 'watermark', text: '', color: '#000000', opacity: .2, angle: 45, width: 65 },
    ];
    for (const operation of bad) await expect(transformPdf(sources, pages, 'bad', operation)).rejects.toThrow();
    expect(sources[0].bytes).toEqual(original);
  });

  it('embeds a shared image on selected rotated pages and validates placement', async () => {
    const { sources, pages } = await fixture(2);
    const image = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j4IoAAAAASUVORK5CYII='), c => c.charCodeAt(0));
    const operation: PdfOperation = { kind: 'stamp', image, x: 80, y: 90, width: 25, angle: 45, opacity: .8 };
    const data = await transformPdf(sources, pages, 'signature', operation);
    const doc = await PDFDocument.load(data.bytes);
    expect(doc.getPageCount()).toBe(5);
    expect(doc.getPages().map(p => p.getRotation().angle)).toEqual([0, 90, 180, 270, 0]);
    expect(doc.getPages().every(p => p.node.Resources()?.has(PDFName.of('XObject')))).toBe(true);
    for (const change of [{ x: NaN }, { y: 101 }, { width: 0 }, { angle: 91 }, { opacity: 0 }]) await expect(transformPdf(sources, pages, 'invalid', { ...operation, ...change })).rejects.toThrow();
  });
});

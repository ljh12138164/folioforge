import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFName, degrees } from 'pdf-lib';
import { createSample, exportPdf, inspectFile, interleavePages, movePage, parsePageRange, safeFilename } from './core';
import type { PdfPage } from './core';

describe('local PDF workflow', () => {
  it('interleaves duplex scans without losing references, rotation or unmatched pages', async () => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 7; i++) doc.addPage([210 + i, 310]);
    const bytes = await doc.save();
    const pages: PdfPage[] = Array.from({ length: 7 }, (_, index) => ({ id: String(index), sourceId: 'scan', index, rotation: index % 4 * 90 }));
    const original = pages.map(p => ({ ...p }));
    const next = interleavePages(pages.slice(0, 4), pages.slice(4), true);
    expect(next.map(p => p.index)).toEqual([0, 6, 1, 5, 2, 4, 3]);
    expect(new Set(next.map(p => p.id)).size).toBe(7);
    expect(pages).toEqual(original);
    expect(interleavePages(pages.slice(0, 2), pages.slice(2), false).map(p => p.index)).toEqual([0, 2, 1, 3, 4, 5, 6]);
    expect(interleavePages([], pages, true)).toEqual([...pages].reverse());
    expect(interleavePages(pages, [], true)).toEqual(pages);
    const output = await PDFDocument.load(await exportPdf([{ id: 'scan', name: 'scan.pdf', bytes, originalSize: bytes.length }], next, 'duplex'));
    expect(output.getPages().map(p => p.getWidth())).toEqual([210, 216, 211, 215, 212, 214, 213]);
    expect(output.getPages().map(p => p.getRotation().angle)).toEqual(next.map(p => p.rotation));
  });

  it('imports, merges, reorders, rotates and extracts real pages without changing the source', async () => {
    const first = await PDFDocument.create();
    first.addPage([210, 310]);
    first.addPage([220, 320]).setRotation(degrees(90));
    const bytes = await first.save();
    const original = bytes.slice();
    const inspected = await inspectFile(bytes, 'first.pdf');
    expect(inspected.rotations).toEqual([0, 90]);
    const second = await PDFDocument.create();
    second.addPage([230, 330]);
    const sources = [{ id: 'a', name: 'first.pdf', bytes, originalSize: bytes.length }, { id: 'b', name: 'second.pdf', bytes: await second.save(), originalSize: 0 }];
    const pages: PdfPage[] = [
      { id: '1', sourceId: 'a', index: 0, rotation: 0 },
      { id: '2', sourceId: 'a', index: 1, rotation: 180 },
      { id: '3', sourceId: 'b', index: 0, rotation: 270 },
    ];
    const arranged = movePage(pages, 2, 0);
    const result = await PDFDocument.load(await exportPdf(sources, arranged, 'arranged'));
    expect(result.getPages().map(p => p.getWidth())).toEqual([230, 210, 220]);
    expect(result.getPages().map(p => p.getRotation().angle)).toEqual([270, 0, 180]);
    const extract = await PDFDocument.load(await exportPdf(sources, [arranged[2]], 'extract'));
    expect(extract.getPageCount()).toBe(1);
    expect(extract.getPage(0).getWidth()).toBe(220);
    expect(bytes).toEqual(original);
    expect(movePage(pages, 0, -1)).toBe(pages);
  });

  it('rejects empty, malformed, over-limit, encrypted and interactive documents', async () => {
    await expect(inspectFile(new Uint8Array(), 'empty.pdf')).rejects.toThrow('文件为空');
    await expect(inspectFile(new TextEncoder().encode('hello'), 'fake.pdf')).rejects.toThrow('不是有效');
    await expect(inspectFile(new TextEncoder().encode('%PDF- broken'), 'broken.pdf')).rejects.toThrow('损坏');
    await expect(inspectFile(new Uint8Array(40 * 1024 * 1024 + 1), 'large.pdf')).rejects.toThrow('40 MiB');
    const form = await PDFDocument.create();
    const page = form.addPage();
    form.getForm().createTextField('name').addToPage(page);
    await expect(inspectFile(await form.save(), 'form.pdf')).rejects.toThrow('交互表单');
    const encrypted = await PDFDocument.create();
    encrypted.addPage();
    encrypted.context.trailerInfo.Encrypt = encrypted.context.register(encrypted.context.obj({ Filter: PDFName.of('Standard') }));
    await expect(inspectFile(await encrypted.save(), 'protected.pdf')).rejects.toThrow('加密');
    const tooMany = await PDFDocument.create();
    for (let i = 0; i < 201; i++) tooMany.addPage();
    await expect(inspectFile(await tooMany.save(), 'many.pdf')).rejects.toThrow('200 页');
  });

  it('generates the three-page sample and accepts only bounded page ranges', async () => {
    const sample = await inspectFile(await createSample(), 'sample.pdf');
    expect(sample.rotations).toEqual([0, 0, 0]);
    expect(parsePageRange('1-3， 5, 2', 5)).toEqual([0, 1, 2, 4]);
    for (const bad of ['', '0', '-1', '3-1', '6', '1,,2', '1-999999999', '1.5']) expect(() => parsePageRange(bad, 5)).toThrow();
    expect(safeFilename('../report?.pdf')).toBe('.._report_');
  });
});

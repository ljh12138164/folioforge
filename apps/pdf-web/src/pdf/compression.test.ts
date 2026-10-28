import { expect, test } from 'vitest';
import { PDFDocument, degrees } from 'pdf-lib';
import { optimizePdf } from './compression';

test('compression compares original bytes only for an unchanged complete source; selections and rotations use their current export', async () => {
  const doc = await PDFDocument.create(); doc.addPage([300, 400]).drawText('FIRST'); doc.addPage([500, 600]).drawText('SECOND');
  const bytes = await doc.save({ useObjectStreams: false });
  const source = { id: 's', name: 'sample.pdf', bytes, originalSize: bytes.length };
  const pages = [0, 1].map(index => ({ id: String(index), sourceId: 's', index, rotation: 0 }));
  const whole = await optimizePdf([source], pages, 'test');
  expect(whole.original).toEqual(bytes); expect(whole.bytes.length).toBeLessThan(bytes.length);
  const changed = await optimizePdf([source], [{ ...pages[1], rotation: 90 }], 'selected');
  const exported = await PDFDocument.load(changed.bytes);
  expect(exported.getPageCount()).toBe(1); expect(exported.getPage(0).getWidth()).toBe(500); expect(exported.getPage(0).getRotation()).toEqual(degrees(90));
  expect(changed.bytes.length).toBeLessThanOrEqual(changed.original.length);
  const compact = { ...source, bytes: whole.bytes };
  const repeated = await optimizePdf([compact], pages, 'test');
  expect(repeated.bytes.length).toBeLessThanOrEqual(whole.bytes.length);
});

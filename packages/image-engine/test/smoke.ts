import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ImageMagick, MagickFormat, MagickImageCollection, MagickImage, MagickColors, Quantum, initializeImageMagick } from '@imagemagick/magick-wasm';
import { convert, getCapabilities } from '../src/convert.ts';
import type { ConvertOptions } from '../src/types.ts';

await initializeImageMagick(readFileSync(fileURLToPath(import.meta.resolve('@imagemagick/magick-wasm/magick.wasm'))));
const png = ImageMagick.read(MagickColors.Transparent, 320, 180, (image) => { image.comment = 'private test metadata'; return image.write(MagickFormat.Png, (data) => new Uint8Array(data)); });
const options: ConvertOptions = { format: 'WEBP', quality: 82, stripMetadata: true, background: '#ff0000', maxWidth: 160, maxHeight: 120 };
const fixtureDir = new URL('../../../work/fixtures/', import.meta.url);
mkdirSync(fixtureDir, { recursive: true });
writeFileSync(new URL('transparent.png', fixtureDir), png);
writeFileSync(new URL('broken.png', fixtureDir), 'not an image');

for (const capability of getCapabilities().filter((item) => item.write)) {
  const result = convert(png, { ...options, format: capability.id });
  assert.equal(result.width, 160);
  assert.equal(result.height, 90);
  assert(result.data.byteLength > 0);
  assert(result.before.byteLength > 0 && result.after.byteLength > 0);
  ImageMagick.read(result.data, capability.id as MagickFormat, (image) => { assert.equal(image.width, 160); assert.equal(image.height, 90); });
  // Read back every generated format through our import path, not just through the library.
  assert.equal(convert(result.data, { ...options, format: 'PNG' }, capability.id).width, 160);
  console.log(`PASS ${capability.id} encode → decode → PNG (${result.data.length} bytes)`);
}

const transparent = convert(png, { ...options, format: 'PNG' });
ImageMagick.read(transparent.data, (image) => {
  assert(image.hasAlpha);
  image.getPixels((pixels) => assert.equal(pixels.getPixel(0, 0).at(-1), 0));
  assert.equal(image.comment, null);
});
const jpeg = convert(png, { ...options, format: 'JPEG', quality: 100 });
ImageMagick.read(jpeg.data, (image) => image.getPixels((pixels) => {
  const pixel = pixels.getPixel(0, 0);
  assert(pixel[0] / Quantum.max > 0.98 && pixel[1] / Quantum.max < 0.02 && pixel[2] / Quantum.max < 0.02);
}));
const retained = convert(png, { ...options, format: 'PNG', stripMetadata: false });
ImageMagick.read(retained.data, (image) => assert.equal(image.comment, 'private test metadata'));
assert.equal(convert(png, { ...options, maxWidth: 1600, maxHeight: undefined }).width, 320);
const icon = convert(png, { ...options, format: 'ICO', maxWidth: undefined, maxHeight: undefined });
assert.equal(icon.width, 256);
assert.throws(() => convert(png, { ...options, quality: 0 }), /质量/);
assert.throws(() => convert(png, { ...options, maxWidth: -1 }), /尺寸/);
assert.throws(() => convert(png, { ...options, format: 'SVG' }), /不支持导出/);
assert.throws(() => convert(new Uint8Array(), options), /非空/);
assert.throws(() => convert(new TextEncoder().encode('broken'), options));

const animated = MagickImageCollection.use((images) => {
  images.push(MagickImage.create(png));
  images.push(MagickImage.create(png));
  return images.write(MagickFormat.Gif, (bytes) => new Uint8Array(bytes));
});
writeFileSync(new URL('animated.gif', fixtureDir), animated);
assert.throws(() => convert(animated, options), /多帧或多页/);
console.log('PASS transparency, background, metadata, aspect ratio, ICO bounds, validation, animation rejection');

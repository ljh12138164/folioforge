import {
  AlphaAction, ColorSpace, ImageMagick, Magick, MagickColor, MagickFormat,
  MagickGeometry, MagickImageInfo, MagickReadSettings,
} from '@imagemagick/magick-wasm';
import type { IMagickImage } from '@imagemagick/magick-wasm';
import { formats, MAX_FILE_BYTES, MAX_PIXELS } from './types.ts';
import type { Capability, Conversion, ConvertOptions, FormatId } from './types.ts';

export function getCapabilities(): Capability[] {
  return formats.map(({ id }) => {
    const info = Magick.supportedFormats.find((item) => item.format === id);
    return { id, read: id === 'SVG' || (info?.supportsReading ?? false), write: id !== 'SVG' && (info?.supportsWriting ?? false) };
  });
}

function thumbnail(image: IMagickImage): Uint8Array<ArrayBuffer> {
  return image.clone((copy) => {
    const geometry = new MagickGeometry(1200, 900);
    geometry.greater = true;
    copy.resize(geometry);
    copy.strip();
    return copy.write(MagickFormat.Png, (bytes) => new Uint8Array(bytes));
  });
}

export function convert(bytes: Uint8Array, options: ConvertOptions, sourceFormat?: FormatId): Conversion {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_BYTES) {
    throw new Error('请选择非空、且不超过 40 MB 的图片。');
  }
  const capability = getCapabilities().find((item) => item.id === options.format);
  if (!capability?.write) throw new Error('当前引擎不支持导出此格式。');
  if (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100) {
    throw new Error('图片质量应为 1–100 的整数。');
  }
  for (const dimension of [options.maxWidth, options.maxHeight]) {
    if (dimension !== undefined && (!Number.isInteger(dimension) || dimension < 1 || dimension > 16384)) {
      throw new Error('尺寸应为 1–16384 的整数。');
    }
  }
  if (!/^#[0-9a-f]{6}$/i.test(options.background)) throw new Error('无效的背景颜色。');
  const inputFormat = sourceFormat as MagickFormat | undefined;
  const settings = new MagickReadSettings({ frameCount: 2, format: inputFormat });
  const info = MagickImageInfo.create(bytes, new MagickReadSettings({ format: inputFormat }));
  if (!getCapabilities().some((item) => item.id === info.format && item.read)) {
    // HEIF uses the same decoder as HEIC; JPEG aliases are reported as JPEG.
    if (info.format !== MagickFormat.Heif || !getCapabilities().some((item) => item.id === 'HEIC' && item.read)) {
      throw new Error(`暂不支持读取 ${info.format} 格式。请在格式一览中查看支持范围。`);
    }
  }
  if (info.width * info.height > MAX_PIXELS) throw new Error('图片超过 4800 万像素，请先缩小后再试。');

  // ponytail: static images only; read at most two frames to detect animation/multipage files.
  return ImageMagick.readCollection(bytes, settings, (images) => {
    if (images.length !== 1 && info.format !== MagickFormat.Psd) throw new Error('此文件包含多帧或多页。当前版本只转换静态图片，不会丢弃其余帧。');
    const image = images[0];
    image.autoOrient();
    const originalWidth = image.width;
    const originalHeight = image.height;
    const before = thumbnail(image);
    const scale = Math.min(1, (options.maxWidth ?? image.width) / image.width, (options.maxHeight ?? image.height) / image.height,
      options.format === 'ICO' ? 256 / Math.max(image.width, image.height) : 1);
    if (scale < 1) image.resize(Math.max(1, Math.round(image.width * scale)), Math.max(1, Math.round(image.height * scale)));
    image.quality = options.quality;
    if (options.format === 'JPEG' || options.format === 'BMP') {
      image.colorSpace = ColorSpace.sRGB;
      image.backgroundColor = new MagickColor(options.background);
      image.alpha(AlphaAction.Remove);
    }
    if (options.stripMetadata) image.strip();
    const width = image.width;
    const height = image.height;
    const data = image.write(options.format as MagickFormat, (result) => new Uint8Array(result));
    // Decode the exported bytes so the preview includes actual compression artifacts.
    const after = ImageMagick.read(data, options.format as MagickFormat, (output) => thumbnail(output));
    return { data, before, after, width, height, originalWidth, originalHeight, sourceFormat: info.format };
  });
}

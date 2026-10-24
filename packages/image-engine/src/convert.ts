import {
  AlphaAction, ColorSpace, ImageMagick, Magick, MagickColor, MagickFormat,
  MagickGeometry, MagickImageInfo, MagickReadSettings,
} from '@imagemagick/magick-wasm';
import type { IMagickImage } from '@imagemagick/magick-wasm';
import initHeic, { encode_heic } from '@pixelforge/heic-wasm';
import initVectorizer, { vectorize_svg } from '@pixelforge/vectorizer-wasm';
import { formats, MAX_FILE_BYTES, MAX_PIXELS } from './types.ts';
import type { Capability, Conversion, ConvertOptions, FormatId } from './types.ts';

let heicReady = false;
let vectorizerReady = false;
export async function initializeHeic(bytes: Uint8Array<ArrayBuffer>) {
  await initHeic({ module_or_path: bytes });
  heicReady = true;
}

export async function initializeVectorizer(bytes: Uint8Array<ArrayBuffer>) {
  await initVectorizer({ module_or_path: bytes });
  vectorizerReady = true;
}

export function getCapabilities(): Capability[] {
  return formats.map(({ id }) => {
    const info = Magick.supportedFormats.find((item) => item.format === id);
    return { id, read: id === 'SVG' || (info?.supportsReading ?? false), write: id === 'HEIC' ? heicReady : id === 'SVG' ? vectorizerReady : (info?.supportsWriting ?? false) };
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
  if (options.format === 'SVG' && !['poster', 'bw', 'photo'].includes(options.svgPreset ?? 'poster')) throw new Error('无效的 SVG 描摹模式。');
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
    if (scale < 1) {
      const geometry = new MagickGeometry(Math.max(1, Math.round(image.width * scale)), Math.max(1, Math.round(image.height * scale)));
      // The shared scale already preserves aspect ratio; avoid a second fit after rounding.
      geometry.ignoreAspectRatio = true;
      image.resize(geometry);
    }
    image.quality = options.quality;
    if (options.format === 'SVG' && image.width * image.height > 4_000_000) throw new Error('SVG 描摹最多支持 400 万像素，请先调整最大宽高，例如 2000 × 2000。');
    if (options.format === 'JPEG' || options.format === 'BMP' || options.format === 'HEIC' || options.format === 'SVG') {
      image.colorSpace = ColorSpace.sRGB;
      image.backgroundColor = new MagickColor(options.background);
      image.alpha(AlphaAction.Remove);
    }
    if (options.stripMetadata || options.format === 'HEIC' || options.format === 'SVG') image.strip();
    const width = image.width;
    const height = image.height;
    const data = options.format === 'SVG'
      ? image.getPixels((pixels) => new TextEncoder().encode(vectorize_svg(pixels.toByteArray(0, 0, width, height, 'RGBA')!, width, height, options.svgPreset ?? 'poster')))
      : options.format === 'HEIC'
      ? image.getPixels((pixels) => new Uint8Array(encode_heic(pixels.toByteArray(0, 0, width, height, 'RGBA')!, width, height, options.quality)))
      : image.write(options.format as MagickFormat, (result) => new Uint8Array(result));
    // Decode the exported bytes so the preview includes actual compression artifacts.
    // The browser client renders the generated SVG itself; no external SVG delegate is required.
    const after = options.format === 'SVG' ? new Uint8Array(0) : ImageMagick.read(data, options.format as MagickFormat, (output) => thumbnail(output));
    return { data, before, after, width, height, originalWidth, originalHeight, sourceFormat: info.format };
  });
}

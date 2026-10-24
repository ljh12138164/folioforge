export const formats = [
  { id: 'JPEG', label: 'JPG', extension: 'jpg', mime: 'image/jpeg', description: '照片与通用分享', lossy: true },
  { id: 'PNG', label: 'PNG', extension: 'png', mime: 'image/png', description: '无损与透明背景', lossy: false },
  { id: 'WEBP', label: 'WebP', extension: 'webp', mime: 'image/webp', description: '网页图片格式', lossy: true },
  { id: 'AVIF', label: 'AVIF', extension: 'avif', mime: 'image/avif', description: 'AV1 图像格式', lossy: true },
  { id: 'GIF', label: 'GIF', extension: 'gif', mime: 'image/gif', description: '静态索引色图片', lossy: false },
  { id: 'TIFF', label: 'TIFF', extension: 'tiff', mime: 'image/tiff', description: '印刷与图像交换', lossy: false },
  { id: 'BMP', label: 'BMP', extension: 'bmp', mime: 'image/bmp', description: '经典位图格式', lossy: false },
  { id: 'ICO', label: 'ICO', extension: 'ico', mime: 'image/x-icon', description: '网站与应用图标', lossy: false },
  { id: 'JXL', label: 'JPEG XL', extension: 'jxl', mime: 'image/jxl', description: 'JPEG XL 图像格式', lossy: true },
  { id: 'HEIC', label: 'HEIC', extension: 'heic', mime: 'image/heic', description: '手机照片格式', lossy: true },
  { id: 'QOI', label: 'QOI', extension: 'qoi', mime: 'image/qoi', description: '无损图像格式', lossy: false },
  { id: 'TGA', label: 'TGA', extension: 'tga', mime: 'image/x-tga', description: '纹理与图形资源', lossy: false },
  { id: 'PSD', label: 'PSD', extension: 'psd', mime: 'image/vnd.adobe.photoshop', description: '扁平图像，不保留图层', lossy: false },
  { id: 'JP2', label: 'JPEG 2000', extension: 'jp2', mime: 'image/jp2', description: 'JPEG 2000 图像', lossy: true },
  { id: 'EXR', label: 'EXR', extension: 'exr', mime: 'image/x-exr', description: '图像交换，不保证 HDR 保真', lossy: false },
  { id: 'SVG', label: 'SVG', extension: 'svg', mime: 'image/svg+xml', description: '描摹为矢量路径，适合图标与线稿', lossy: false },
] as const;

export type FormatId = (typeof formats)[number]['id'];
export type Capability = { id: FormatId; read: boolean; write: boolean };
export type ConvertOptions = {
  format: FormatId;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  stripMetadata: boolean;
  background: string;
  svgPreset?: 'poster' | 'bw' | 'photo';
};
export type Conversion = {
  data: Uint8Array<ArrayBuffer>;
  before: Uint8Array<ArrayBuffer>;
  after: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  sourceFormat: string;
};
export type WorkerRequest = { id: number; bytes: ArrayBuffer; options: ConvertOptions; sourceFormat?: FormatId };
export type WorkerResponse =
  | { type: 'ready'; capabilities: Capability[] }
  | { type: 'result'; id: number; result: Conversion }
  | { type: 'error'; id?: number; error: string };

export const MAX_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_PIXELS = 48_000_000;

import { sitePages, siteUrl } from '../../seo';

export const dynamic = 'force-static';
export function GET() {
  const links = Object.values(sitePages).map(page => `- [${page.title}](${siteUrl}${page.path}): ${page.description}`).join('\n');
  return new Response(`# PixelForge

> 在浏览器本地批量转换图片格式、调整画质与尺寸。图片内容无需上传服务器。

## 页面
${links}

## 功能与边界
- 图片：16 种导出格式，支持 HEIC 编解码、HEIF 导入与 SVG 路径描摹。PSD 仅合成图，SVG 不保留原始文字与图层，照片描摹是近似结果。
- 图片限制：单张 40 MB、4800 万像素；SVG 描摹最多 400 万像素。宽高为等比缩小的边界，不放大原图。
- 生产域名使用 Umami 统计页面访问；不发送导入文件或转换结果，排除 URL 查询参数与片段。本机预览和桌面端不启用统计。
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

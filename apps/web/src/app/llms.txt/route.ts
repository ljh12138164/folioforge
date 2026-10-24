import { sitePages, siteUrl } from '../../seo';

export const dynamic = 'force-static';
export function GET() {
  const links = Object.values(sitePages).map(page => `- [${page.title}](${siteUrl}${page.path}): ${page.description}`).join('\n');
  return new Response(`# FolioForge 页匠

> 在浏览器本地处理 PDF 与图片的免费工具站。文档与图片内容无需上传服务器。

## 页面
${links}

## 功能与边界
- PDF：合并、拆分、提取、排序、旋转、删除、20 步撤销重做、页码、水印、外观签名、裁剪、A4 与 2/4 页拼版、双面重排、空白页候选检测、文字提取与视觉对比。
- OCR：本地简体中文与英文模型，导出 TXT 或可搜索 PDF；识别结果需人工核对。
- 压缩：对象重存或有损扫描件降采样；降采样会移除原有文字层与链接。文件变大时回退原文件。
- PDF 限制：单个 40 MiB、总计 100 MiB、最多 200 页。不支持密码加密 PDF、交互表单与数字签名字段。
- 图片：16 种导出格式，支持 HEIC 编解码、HEIF 导入与 SVG 路径描摹。PSD 仅合成图，SVG 不保留原始文字与图层，照片描摹是近似结果。
- 图片限制：单张 40 MB、4800 万像素；SVG 描摹最多 400 万像素。宽高为等比缩小的边界，不放大原图。
- PDF 离线使用需要先完成资源缓存；清除网站数据会移除缓存与本机保存的图片任务。PDF 工作台任务不跨刷新保存。
- 生产域名使用 Umami 统计页面访问；不发送导入文件或转换结果，排除 URL 查询参数与片段。本机预览和桌面端不启用统计。
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

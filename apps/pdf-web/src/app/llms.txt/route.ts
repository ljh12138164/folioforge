import { sitePages, siteUrl } from '../../seo';

export const dynamic = 'force-static';
export function GET() {
  const links = Object.values(sitePages).map(page => `- [${page.title}](${siteUrl}${page.path}): ${page.description}`).join('\n');
  return new Response(`# FolioForge 页匠

> 在浏览器本地整理、编辑、转换 PDF 的免费工具站。文档内容无需上传服务器。

## 页面
${links}

## 功能与边界
- PDF：合并、拆分、提取、排序、旋转、删除、20 步撤销重做、页码、水印、外观签名、裁剪、A4 与 2/4 页拼版、双面重排、空白页候选检测、文字提取与视觉对比。
- OCR：本地简体中文与英文模型，导出 TXT 或可搜索 PDF；识别结果需人工核对。
- 压缩：对象重存或有损扫描件降采样；降采样会移除原有文字层与链接。文件变大时回退原文件。
- PDF 限制：单个 40 MiB、总计 100 MiB、最多 200 页。不支持密码加密 PDF、交互表单与数字签名字段。
- PDF 离线使用需要先完成资源缓存；清除网站数据会移除缓存。PDF 工作台任务不跨刷新保存。
- 生产域名使用 Umami 统计页面访问；不发送导入文件或转换结果，排除 URL 查询参数与片段。本机预览和桌面端不启用统计。
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

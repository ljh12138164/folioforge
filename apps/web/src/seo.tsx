import type { Metadata } from 'next';

const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://folioforge.ljhboard.cn');
if (!['https:', 'http:'].includes(origin.protocol) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment.');
}
export const siteUrl = origin.origin;
export const indexable = process.env.NEXT_PUBLIC_SITE_INDEXABLE !== 'false';
export const sitePages = {
  home: { path: '/', title: 'FolioForge 页匠 · 本地 PDF 与图片工具箱', description: '在浏览器本地合并、拆分、整理 PDF，完成中英文 OCR、压缩、水印与签名；批量转换 16 种图片格式。文件无需上传，免费使用。' },
  pdf: { path: '/pdf/', title: '离线 PDF 工具：合并、拆分、OCR 与压缩 · FolioForge 页匠', description: '在本机整理 PDF 页面、双面重排、检测空白页、添加签名水印、裁剪拼版、提取文字与视觉对比。支持中英文 OCR、可搜索 PDF 和压缩，资源缓存完成后可离线使用。' },
  convert: { path: '/convert/', title: '图片格式转换：HEIC、WebP、AVIF 与 SVG · FolioForge 页匠', description: '本地批量转换 JPG、PNG、WebP、AVIF、HEIC 等 16 种图片格式，实时对照转换画质，等比调整尺寸，导出 SVG 矢量描摹路径或打包 ZIP。图片无需上传。' },
  images: { path: '/images/', title: '图片格式支持与转换示例 · FolioForge 页匠', description: '试用真实的本地图片转换，查看画质与尺寸调整效果。了解 JPG、PNG、WebP、AVIF、HEIC、SVG 等 16 种导出格式及透明背景、图层与矢量描摹的限制。' },
  guide: { path: '/guide/', title: 'PDF 与图片工具使用指南、文件限制与隐私 · FolioForge 页匠', description: '了解如何合并拆分 PDF、识别中英文扫描件、压缩文档、转换 HEIC 与描摹 SVG。包含操作步骤、格式支持、离线条件、文件上限及本地存储和访问统计说明。' },
} as const;
type SitePage = keyof typeof sitePages;

export function pageMetadata(page: SitePage): Metadata {
  const { path, title, description } = sitePages[page];
  const url = siteUrl + path;
  const images = [{ url: siteUrl + '/social-card.png', width: 1200, height: 630, alt: 'FolioForge 页匠：本地 PDF 与图片工具箱' }];
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { type: 'website', locale: 'zh_CN', siteName: 'FolioForge 页匠', title, description, url, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map(image => image.url) },
  };
}

export function PageSchema({ page }: { page: SitePage }) {
  const { path, title, description } = sitePages[page];
  const url = siteUrl + path;
  const graph: Record<string, unknown>[] = [
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: title, description, inLanguage: 'zh-CN', isPartOf: { '@id': siteUrl + '/#website' } },
  ];
  if (page === 'home') graph.push({ '@type': 'WebSite', '@id': siteUrl + '/#website', url: siteUrl + '/', name: 'FolioForge 页匠', alternateName: '页匠', inLanguage: 'zh-CN', description });
  else graph.push({ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'FolioForge 页匠', item: siteUrl + '/' },
    { '@type': 'ListItem', position: 2, name: title.split(' · ')[0], item: url },
  ] });
  if (page === 'pdf' || page === 'convert') graph.push({
    '@type': 'WebApplication', '@id': url + '#application', name: page === 'pdf' ? 'FolioForge PDF 工作台' : 'FolioForge 图片转换工作台',
    url, description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web browser', inLanguage: 'zh-CN',
    isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    browserRequirements: 'Requires JavaScript, WebAssembly and a modern browser.',
  });
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') }} />;
}

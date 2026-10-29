import type { Metadata } from 'next';

const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf.ljhboard.cn');
if (!['https:', 'http:'].includes(origin.protocol) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment.');
}
export const siteUrl = origin.origin;
export const indexable = process.env.NEXT_PUBLIC_SITE_INDEXABLE !== 'false';
export const sitePages = {
  home: { path: '/', title: 'FolioForge 页匠 · 本地 PDF 工具箱', description: '在浏览器本地合并、拆分、整理 PDF，完成中英文 OCR、压缩、水印与签名。文件无需上传，免费使用。' },
  pdf: { path: '/pdf/', title: '离线 PDF 工具：合并、拆分、OCR 与压缩 · FolioForge 页匠', description: '在本机整理 PDF 页面、双面重排、检测空白页、添加签名水印、裁剪拼版、提取文字与视觉对比。支持中英文 OCR、可搜索 PDF 和压缩，资源缓存完成后可离线使用。' },
  guide: { path: '/guide/', title: 'PDF 工具使用指南、文件限制与隐私 · FolioForge 页匠', description: '了解如何合并拆分 PDF、识别中英文扫描件、压缩文档。包含操作步骤、格式支持、离线条件、文件上限及本地存储和访问统计说明。' },
} as const;
type SitePage = keyof typeof sitePages;

export function pageMetadata(page: SitePage): Metadata {
  const { path, title, description } = sitePages[page];
  const url = siteUrl + path;
  const images = [{ url: siteUrl + '/social-card.png', width: 1200, height: 630, alt: 'FolioForge 页匠：本地 PDF 工具箱' }];
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
  if (page === 'home') graph.push({ '@type': 'WebSite', '@id': siteUrl + '/#website', url: siteUrl + '/', name: 'FolioForge 页匠', alternateName: ['页匠', 'FolioForge'], inLanguage: 'zh-CN', description });
  else graph.push({ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'FolioForge 页匠', item: siteUrl + '/' },
    { '@type': 'ListItem', position: 2, name: title.split(' · ')[0], item: url },
  ] });
  if (page === 'pdf') graph.push({
    '@type': 'WebApplication', '@id': url + '#application', name: 'FolioForge PDF 工作台',
    url, description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web browser', inLanguage: 'zh-CN',
    isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    browserRequirements: 'Requires JavaScript, WebAssembly and a modern browser.',
    featureList: [
      '多份 PDF 合并与页序自由调整',
      '拆分每页为独立文档并打包 ZIP',
      '本地轻量模型中英文扫描件 OCR',
      '原笔迹手写签名与透明印章',
      '无损对象重存与扫描件降采样压缩',
      '双面扫描交错排序',
      '墨迹阈值空白页检测',
      '页面裁剪与 A4 适配排版',
      '多页拼版 (2合1 / 4合1)',
      '文档已有文字提取与双文档对比',
    ],
  });
  if (page === 'guide') graph.push({
    '@type': 'TechArticle', '@id': url + '#article', headline: title, description, inLanguage: 'zh-CN',
    datePublished: '2026-10-27T00:00:00+08:00', dateModified: '2026-10-29T00:00:00+08:00', mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'FolioForge 页匠', url: siteUrl + '/' },
  });
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') }} />;
}

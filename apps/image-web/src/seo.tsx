import type { Metadata } from 'next';

const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://img.ljhboard.cn');
if (!['https:', 'http:'].includes(origin.protocol) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment.');
}
export const siteUrl = origin.origin;
export const indexable = process.env.NEXT_PUBLIC_SITE_INDEXABLE !== 'false';
export const sitePages = {
  home: { path: '/', title: 'PixelForge · 本地图片格式转换与压缩', description: '在浏览器本地批量转换 JPG、PNG、WebP、AVIF、HEIC 等 16 种图片格式，调整画质与尺寸，预览实际转换结果并下载 ZIP。图片无需上传。' },
  convert: { path: '/convert/', title: '图片格式转换：HEIC、WebP、AVIF 与 SVG · PixelForge', description: '本地批量转换 JPG、PNG、WebP、AVIF、HEIC 等 16 种图片格式，实时对照转换画质，等比调整尺寸，导出 SVG 矢量描摹路径或打包 ZIP。图片无需上传。' },
  images: { path: '/images/', title: '图片格式支持与转换示例 · PixelForge', description: '试用真实的本地图片转换，查看画质与尺寸调整效果。了解 JPG、PNG、WebP、AVIF、HEIC、SVG 等 16 种导出格式及透明背景、图层与矢量描摹的限制。' },
  guide: { path: '/guide/', title: '图片转换使用指南、格式限制与隐私 · PixelForge', description: '了解本地图片批量转换、画质与尺寸调整、HEIC 编解码和 SVG 描摹，查看格式支持、文件限制、任务保存及隐私说明。' },
} as const;
type SitePage = keyof typeof sitePages;

export function pageMetadata(page: SitePage): Metadata {
  const { path, title, description } = sitePages[page];
  const url = siteUrl + path;
  const images = [{ url: siteUrl + '/social-card.png', width: 1200, height: 630, alt: 'PixelForge：本地图片格式转换' }];
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { type: 'website', locale: 'zh_CN', siteName: 'PixelForge', title, description, url, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map(image => image.url) },
  };
}

export function PageSchema({ page }: { page: SitePage }) {
  const { path, title, description } = sitePages[page];
  const url = siteUrl + path;
  const graph: Record<string, unknown>[] = [
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: title, description, inLanguage: 'zh-CN', isPartOf: { '@id': siteUrl + '/#website' } },
  ];
  if (page === 'home') graph.push({ '@type': 'WebSite', '@id': siteUrl + '/#website', url: siteUrl + '/', name: 'PixelForge', inLanguage: 'zh-CN', description });
  else graph.push({ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'PixelForge', item: siteUrl + '/' },
    { '@type': 'ListItem', position: 2, name: title.split(' · ')[0], item: url },
  ] });
  if (page === 'convert') graph.push({
    '@type': 'WebApplication', '@id': url + '#application', name: 'PixelForge 图片转换工作台',
    url, description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web browser', inLanguage: 'zh-CN',
    isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    browserRequirements: 'Requires JavaScript, WebAssembly and a modern browser.',
  });
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') }} />;
}

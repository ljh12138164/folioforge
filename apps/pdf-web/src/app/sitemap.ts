import type { MetadataRoute } from 'next';
import { indexable, sitePages, siteUrl } from '../seo';

export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-10-29');
  return indexable ? Object.values(sitePages).map(page => ({
    url: siteUrl + page.path,
    lastModified,
    changeFrequency: page.path === '/' ? 'daily' : page.path === '/guide/' ? 'monthly' : 'weekly',
    priority: page.path === '/' ? 1.0 : page.path === '/guide/' ? 0.7 : 0.9,
  })) : [];
}

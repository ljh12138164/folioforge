import type { MetadataRoute } from 'next';
import { indexable, sitePages, siteUrl } from '../seo';

export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  return indexable ? Object.values(sitePages).map(page => ({ url: siteUrl + page.path })) : [];
}

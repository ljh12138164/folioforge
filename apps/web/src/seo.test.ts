import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('SEO deployment configuration', () => {
  it('uses one origin for canonical, sharing, sitemap and crawler discovery', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://tools.ljhboard.cn');
    vi.stubEnv('NEXT_PUBLIC_SITE_INDEXABLE', 'true');
    const { pageMetadata, sitePages } = await import('./seo');
    const { default: sitemap } = await import('./app/sitemap');
    const { default: robots } = await import('./app/robots');
    for (const key of Object.keys(sitePages) as (keyof typeof sitePages)[]) {
      const metadata = pageMetadata(key);
      expect(metadata.alternates?.canonical).toBe('https://tools.ljhboard.cn' + sitePages[key].path);
      expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
    }
    expect(sitemap().map(item => item.url)).toEqual(Object.values(sitePages).map(page => 'https://tools.ljhboard.cn' + page.path));
    expect(robots().sitemap).toBe('https://tools.ljhboard.cn/sitemap.xml');
  });

  it('keeps staging builds out of the sitemap while allowing crawlers to see noindex', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_INDEXABLE', 'false');
    const { indexable } = await import('./seo');
    const { default: sitemap } = await import('./app/sitemap');
    const { default: robots } = await import('./app/robots');
    expect(indexable).toBe(false);
    expect(sitemap()).toEqual([]);
    expect(robots()).toEqual({ rules: { userAgent: '*', allow: '/' } });
  });

  it.each(['javascript:alert(1)', 'https://site.test/subpath', 'https://site.test/?test=1', 'https://user:password@site.test'])('rejects an invalid site origin: %s', async origin => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', origin);
    await expect(import('./seo')).rejects.toThrow('NEXT_PUBLIC_SITE_URL');
  });
});

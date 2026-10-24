import type { Metadata } from 'next';
import { Analytics } from '../Analytics';
import { indexable, pageMetadata, siteUrl } from '../seo';
import '../styles.css';

const directionContract = `<!--
THESIS: Local document and image workbenches put pages and pixels directly on a calm warm stage, refusing tall marketing banners, multi-colored SaaS badges, and 5-layer nested 1px border boxes.
OWN-WORLD: Warm alabaster ground (#F7F3EC), pure white elevated sheets (#FFFFFF) with soft 14px-16px radii and warm ambient shadow, espresso ink (#26201B), warm stone muted copy (#6C5F56), and action-only persimmon terracotta (#C2451B) reserved strictly for primary execution and active focus; dark theme mirrors in roasted espresso (#161311 / #25201C / #F0825B).
STORY: Visitor sees real local tools immediately, trusts zero-upload browser execution, and drops files or runs a real sample in one click.
FIRST VIEWPORT: Compact 54px studio header; on /pdf/ a 3-column workbench (208px grouped 14-tool rail, spacious page stage, 324px inspector with bottom terracotta CTA); on / grouped scannable directory with live search.
FORM: Challenger digital-design-canon-warm-consumer-app-surface (Action-Only Warm Workbench), chosen over assigned #3, seed e3460d39.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export const metadata: Metadata = {
  ...pageMetadata('home'),
  metadataBase: new URL(siteUrl),
  applicationName: 'FolioForge 页匠',
  robots: { index: indexable, follow: true },
  icons: { icon: { url: '/favicon.svg', type: 'image/svg+xml' } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){var p='system';try{var saved=localStorage.getItem('pixelforge-theme');if(saved==='light'||saved==='dark'||saved==='system')p=saved}catch(e){}var r=document.documentElement;var d=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;r.dataset.themePreference=p;r.dataset.theme=d;r.style.colorScheme=d;window.desktopTheme?.setPreference(p)})()` }} /></head><body><div hidden dangerouslySetInnerHTML={{ __html: directionContract }} />{children}<Analytics /></body></html>;
}

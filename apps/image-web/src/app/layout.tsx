import type { Metadata } from 'next';
import { Analytics } from '../Analytics';
import { indexable, pageMetadata, siteUrl } from '../seo';
import '../styles.css';

export const metadata: Metadata = {
  ...pageMetadata('home'),
  metadataBase: new URL(siteUrl),
  applicationName: 'PixelForge',
  robots: { index: indexable, follow: true },
  icons: { icon: { url: '/favicon.svg', type: 'image/svg+xml' } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){var p='system';try{var saved=localStorage.getItem('pixelforge-theme');if(saved==='light'||saved==='dark'||saved==='system')p=saved}catch(e){}var r=document.documentElement;var d=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;r.dataset.themePreference=p;r.dataset.theme=d;r.style.colorScheme=d;window.desktopTheme?.setPreference(p)})()` }} /></head><body>{children}<Analytics /></body></html>;
}

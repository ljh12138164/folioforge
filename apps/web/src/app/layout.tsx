import type { Metadata } from 'next';
import '../styles.css';

export const metadata: Metadata = {
  title: 'PixelForge · 本地图片格式转换',
  description: '在浏览器中批量转换图片格式、调整质量与尺寸。图片无需上传，支持 WebP、AVIF、JPEG XL 等格式。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN" data-theme="light" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){var p='system';try{var saved=localStorage.getItem('pixelforge-theme');if(saved==='light'||saved==='dark')p=saved}catch(e){}var r=document.documentElement;r.dataset.themePreference=p;r.dataset.theme=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;window.desktopTheme?.setPreference(p)})()` }} /></head><body>{children}</body></html>;
}

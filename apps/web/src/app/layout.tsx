import type { Metadata } from 'next';
import '../styles.css';

const faviconSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect x="4" y="4" width="56" height="56" rx="14" fill="#254edb"/><path d="M18 14C18 12.34 19.34 11 21 11H36.5L47 21.5V49C47 50.66 45.66 52 44 52H21C19.34 52 18 50.66 18 49V14Z" fill="#F5F6FA"/><path d="M36.5 11L47 21.5H39.5C37.84 21.5 36.5 20.16 36.5 18.5V11Z" fill="#7DA2FF"/><rect x="23" y="20" width="10" height="2.6" rx="1.3" fill="#254EDB"/><rect x="23" y="25.5" width="18" height="2.2" rx="1.1" fill="#8DA6F7"/><rect x="22.5" y="31.5" width="20" height="15.5" rx="3" fill="#EDF2FF" stroke="#254EDB" stroke-width="1.8"/><circle cx="27.5" cy="36.5" r="2" fill="#365EE6"/><path d="M23.5 45.5L29.5 39.5L33.5 43L37.5 38.5L41.5 45.5H23.5Z" fill="#254EDB"/></svg>')}`;

export const metadata: Metadata = {
  title: 'FolioForge 页匠 · 本地 PDF 与图片工坊',
  description: '在本机整理 PDF 与转换图片。合并、拆分、OCR、压缩 PDF 页面，批量转换 14 种图片格式，文件无需上传。',
  icons: { icon: faviconSvg },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){var p='system';try{var saved=localStorage.getItem('pixelforge-theme');if(saved==='light'||saved==='dark'||saved==='system')p=saved}catch(e){}var r=document.documentElement;var d=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;r.dataset.themePreference=p;r.dataset.theme=d;r.style.colorScheme=d;window.desktopTheme?.setPreference(p)})()` }} /></head><body>{children}</body></html>;
}

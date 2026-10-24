import { ThemePicker } from './ThemePicker';

export function SiteHeader({ active, onFormats, onHelp }: { active: 'home' | 'images' | 'convert' | 'pdf'; onFormats?: () => void; onHelp?: () => void }) {
  return <header className="header site-header">
    <a className="brand" href="/" aria-label="FolioForge 页匠 首页">
      <span className="brand-symbol" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 4.5C5 3.67 5.67 3 6.5 3H14.5L19 7.5V19.5C19 20.33 18.33 21 17.5 21H6.5C5.67 21 5 20.33 5 19.5V4.5Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M14 3V7.5H18.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 8.5H11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <rect x="8" y="11.5" width="8" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8.5 16.8L11 14.2L12.8 15.8L14.3 14L15.5 16.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      folio<span className="brand-light">forge</span>
      <span className="brand-tag">页匠</span>
    </a>
    <nav aria-label="主导航">
      <a href="/" aria-current={active === 'home' ? 'page' : undefined}>首页</a>
      <a href="/convert/" aria-current={active === 'convert' || active === 'images' ? 'page' : undefined}>图片转换</a>
      <a href="/pdf/" aria-current={active === 'pdf' ? 'page' : undefined}>PDF 工具</a>
      {(active === 'convert' || active === 'images') && (onFormats ? <button onClick={onFormats}>格式支持</button> : <a href="#formats">格式支持</a>)}
      {onHelp ? <button onClick={onHelp}>使用指南</button> : <a href="#guide">使用指南</a>}
    </nav>
    <ThemePicker />
  </header>;
}

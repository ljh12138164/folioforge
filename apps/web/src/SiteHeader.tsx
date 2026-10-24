import { ThemePicker } from './ThemePicker';

export function SiteHeader({ active, onFormats, onHelp }: { active: 'home' | 'images' | 'convert' | 'pdf' | 'guide'; onFormats?: () => void; onHelp?: () => void }) {
  return <header className="header site-header">
    <a className="brand" href="/" aria-label="FolioForge 页匠 首页">
      <span className="brand-symbol" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5.5 4.5C5.5 3.67 6.17 3 7 3H14.5L19 7.5V19.5C19 20.33 18.33 21 17.5 21H7C6.17 21 5.5 20.33 5.5 19.5V4.5Z" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
          <path d="M14.2 3V7.6H18.8" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 9H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="8.5" y="12" width="7.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.45" />
          <circle cx="10.6" cy="14" r="0.8" fill="var(--color-primary)" />
          <path d="M9.1 16.9L11.3 14.7L12.9 16L14.2 14.5L15.4 16.9" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="brand-word">Folio<span className="brand-light">Forge</span></span>
      <span className="brand-tag">页匠</span>
    </a>
    <nav aria-label="主导航">
      <div className="nav-routes">
        <a href="/" aria-current={active === 'home' ? 'page' : undefined}>首页</a>
        <a href="/pdf/" aria-current={active === 'pdf' ? 'page' : undefined}>PDF 工具</a>
        <a href="/convert/" aria-current={active === 'convert' || active === 'images' ? 'page' : undefined}>图片转换</a>
      </div>
      <div className="nav-aux">
        {(active === 'convert' || active === 'images') && (onFormats ? <button type="button" onClick={onFormats}>格式支持</button> : <a href="#formats">格式支持</a>)}
        {onHelp ? <button type="button" onClick={onHelp}>使用指南</button> : <a href="/guide/" aria-current={active === 'guide' ? 'page' : undefined}>使用指南</a>}
      </div>
    </nav>
    <ThemePicker />
  </header>;
}

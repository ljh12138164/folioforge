import { ThemePicker } from '@pixelforge/ui/ThemePicker';

export function SiteHeader({ active, onHelp }: { active: 'home' | 'pdf' | 'guide'; onHelp?: () => void }) {
  return <header className="header site-header">
    <a className="brand" href="/" aria-label="FolioForge 页匠 首页">
      <span className="brand-symbol" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="8.5" y="3.5" width="11" height="15" rx="1.5" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.4" />
          <path d="M4.5 6C4.5 5.17 5.17 4.5 6 4.5H13.2L17.5 8.8V19.5C17.5 20.33 16.83 21 16 21H6C5.17 21 4.5 20.33 4.5 19.5V6Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M13 4.5L17.5 9H14.2C13.54 9 13 8.46 13 7.8V4.5Z" fill="var(--color-primary)" />
          <path d="M3 9.5H5.8M3 13H5.8M3 16.5H5.8" stroke="var(--color-primary)" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M7 11.5H12M7 14H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <rect x="11.8" y="14" width="3.4" height="3.4" rx="0.7" fill="var(--color-primary)" />
        </svg>
      </span>
      <span className="brand-word">Folio<span className="brand-light">Forge</span></span>
      <span className="brand-tag">页匠</span>
    </a>
    <nav aria-label="主导航">
      <div className="nav-routes">
        <a href="/" aria-current={active === 'home' ? 'page' : undefined}>首页</a>
        <a href="/pdf/" aria-current={active === 'pdf' ? 'page' : undefined}>PDF 工具</a>
      </div>
      <div className="nav-aux">
        {onHelp ? <button type="button" onClick={onHelp}>使用指南</button> : <a href="/guide/" aria-current={active === 'guide' ? 'page' : undefined}>使用指南</a>}
      </div>
    </nav>
    <ThemePicker />
  </header>;
}

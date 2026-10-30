'use client';

import { ThemePicker } from '@pixelforge/ui/ThemePicker';
import { LocalePicker } from '@pixelforge/ui/LocalePicker';
import { useImageI18n } from './i18n';

export function SiteHeader({ active, onFormats, onHelp }: { active: 'home' | 'images' | 'convert' | 'guide'; onFormats?: () => void; onHelp?: () => void }) {
  const { t } = useImageI18n();

  return <header className="header site-header">
    <a className="brand" href="/" aria-label={t.header.brandAria}>
      <span className="brand-symbol" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="1.2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="1.2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" fill="currentColor" fillOpacity="0.85" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" fill="var(--color-primary)" />
          <rect x="9.3" y="9.3" width="5.4" height="5.4" rx="1" transform="rotate(45 12 12)" fill="#ffffff" stroke="var(--color-primary)" strokeWidth="1.3" />
          <circle cx="12" cy="12" r="1" fill="var(--color-primary)" />
        </svg>
      </span>
      <span className="brand-word">Pixel<span className="brand-light">Forge</span></span>
      <span className="brand-tag">{t.header.brandTag}</span>
    </a>
    <nav aria-label={t.header.navAria}>
      <div className="nav-routes">
        <a href="/" aria-current={active === 'home' ? 'page' : undefined}>{t.header.home}</a>
        <a href="/convert/" aria-current={active === 'convert' ? 'page' : undefined}>{t.header.convert}</a>
      </div>
      <div className="nav-aux">
        {(active === 'convert' || active === 'images') && (onFormats ? <button type="button" onClick={onFormats}>{t.header.formats}</button> : <a href="/images/#formats">{t.header.formats}</a>)}
        {onHelp ? <button type="button" onClick={onHelp}>{t.header.guide}</button> : <a href="/guide/" aria-current={active === 'guide' ? 'page' : undefined}>{t.header.guide}</a>}
      </div>
    </nav>
    <div className="header-controls">
      <LocalePicker />
      <ThemePicker />
    </div>
  </header>;
}

import { Grid2X2 } from 'lucide-react';
import { ThemePicker } from './ThemePicker';

export function SiteHeader({ active, onFormats, onHelp }: { active: 'home' | 'convert'; onFormats?: () => void; onHelp?: () => void }) {
  return <header className="header site-header">
    <a className="brand" href="/" aria-label="PixelForge 首页"><span className="brand-symbol"><Grid2X2 size={21} strokeWidth={2.2} /></span>pixel<span className="brand-light">forge</span></a>
    <nav aria-label="主导航">
      <a href="/" aria-current={active === 'home' ? 'page' : undefined}>首页</a>
      <a href="/convert/" aria-current={active === 'convert' ? 'page' : undefined}>转换工作台</a>
      {onFormats ? <button onClick={onFormats}>格式支持</button> : <a href="#formats">格式支持</a>}
      {onHelp ? <button onClick={onHelp}>使用指南</button> : <a href="#guide">使用指南</a>}
    </nav>
    <ThemePicker />
  </header>;
}
